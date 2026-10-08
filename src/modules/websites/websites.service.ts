import { Types } from "mongoose";
import { AppError } from "../../middleware/error.middleware.js";
import { generatePrefixedPublicId } from "../../utils/public-id.js";
import { isValidSlug, slugifyName } from "../../utils/slugify.js";
import { WebsiteModel } from "./websites.model.js";
import { PageModel } from "../pages/pages.model.js";
import type { PublicWebsite } from "./websites.types.js";
import { toPublicWebsite } from "./websites.types.js";
import type { WebsiteDocument } from "./websites.model.js";
import { deletePagesForWebsite, listPagesForWebsite } from "../pages/pages.service.js";
import type { PublicPage } from "../pages/pages.types.js";
import type {
  CreateWebsiteInput,
  UpdateWebsiteInput,
} from "./websites.validators.js";

export interface PreviewPageSummary {
  id: string;
  name: string;
  slug: string;
  pageType: PublicPage["pageType"];
  seo: PublicPage["seo"];
}

export async function computeHasUnpublishedChanges(
  website: Pick<WebsiteDocument, "_id" | "updatedAt" | "publishedAt" | "status">
): Promise<boolean> {
  if (website.status !== "PUBLISHED" || !website.publishedAt) {
    return false;
  }
  const publishedAt = website.publishedAt;
  if (website.updatedAt && website.updatedAt > publishedAt) {
    return true;
  }
  const newerPage = await PageModel.findOne({
    websiteId: website._id,
    updatedAt: { $gt: publishedAt },
  })
    .select("_id")
    .lean();
  return Boolean(newerPage);
}

async function toPublicWebsiteWithPublishingFlags(
  doc: WebsiteDocument
): Promise<PublicWebsite> {
  const hasUnpublishedChanges = await computeHasUnpublishedChanges(doc);
  return toPublicWebsite(doc, { hasUnpublishedChanges });
}

export interface WebsitePreviewPayload {
  website: PublicWebsite;
  pages: PreviewPageSummary[];
  page: PublicPage;
}

function toPreviewSummary(p: PublicPage): PreviewPageSummary {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    pageType: p.pageType,
    seo: p.seo,
  };
}

export async function getWebsitePreview(
  workspaceId: string,
  websiteId: string,
  slug?: string
): Promise<WebsitePreviewPayload> {
  const website = await assertWebsiteInWorkspace(workspaceId, websiteId);
  const pages = await listPagesForWebsite(workspaceId, websiteId);

  if (pages.length === 0) {
    throw new AppError("No pages to preview", 404, "PAGE_NOT_FOUND");
  }

  const requested = slug?.trim().toLowerCase();
  let page: PublicPage;

  if (requested) {
    const match = pages.find((p) => p.slug === requested);
    if (!match) {
      throw new AppError("Page not found", 404, "PAGE_NOT_FOUND");
    }
    page = match;
  } else {
    page =
      pages.find((p) => p.pageType === "HOME") ??
      pages.find((p) => p.slug === "home") ??
      pages[0];
  }

  return {
    website,
    pages: pages.map(toPreviewSummary),
    page,
  };
}

async function generateUniqueWebsiteSlug(
  workspaceId: string,
  baseName: string
): Promise<string> {
  let base = slugifyName(baseName) || "site";
  if (!isValidSlug(base)) {
    base = "site";
  }
  let candidate = base;
  let suffix = 2;
  while (
    await WebsiteModel.exists({
      workspaceId: new Types.ObjectId(workspaceId),
      slug: candidate,
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
    if (suffix > 100) {
      throw new AppError("Could not generate slug", 409, "WEBSITE_SLUG_TAKEN");
    }
  }
  return candidate;
}

async function allocateWebsiteIdentities(): Promise<{
  publicId: string;
  subscriptionId: string;
}> {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const publicId = generatePrefixedPublicId("WEB");
    const subscriptionId = generatePrefixedPublicId("SAF");
    const clash = await WebsiteModel.exists({
      $or: [{ publicId }, { subscriptionId }],
    });
    if (!clash) {
      return { publicId, subscriptionId };
    }
  }
  throw new AppError(
    "Could not allocate website identity",
    500,
    "WEBSITE_ID_GENERATION_FAILED"
  );
}

export async function assertWebsiteInWorkspace(
  workspaceId: string,
  websiteId: string
): Promise<PublicWebsite> {
  if (!Types.ObjectId.isValid(websiteId)) {
    throw new AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
  }

  const website = await WebsiteModel.findOne({
    _id: new Types.ObjectId(websiteId),
    workspaceId: new Types.ObjectId(workspaceId),
  });

  if (!website) {
    throw new AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
  }

  return toPublicWebsiteWithPublishingFlags(await ensureWebsiteIdentities(website));
}

async function ensureWebsiteIdentities(
  website: InstanceType<typeof WebsiteModel>
): Promise<InstanceType<typeof WebsiteModel>> {
  if (website.publicId && website.subscriptionId) {
    return website;
  }
  const ids = await allocateWebsiteIdentities();
  if (!website.publicId) website.publicId = ids.publicId;
  if (!website.subscriptionId) website.subscriptionId = ids.subscriptionId;
  await website.save();
  return website;
}

export async function createWebsite(
  workspaceId: string,
  input: CreateWebsiteInput & { name: string }
): Promise<PublicWebsite> {
  const slug = await generateUniqueWebsiteSlug(workspaceId, input.name);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { publicId, subscriptionId } = await allocateWebsiteIdentities();
    try {
      const website = await WebsiteModel.create({
        workspaceId: new Types.ObjectId(workspaceId),
        name: input.name.trim(),
        description: input.description?.trim() ?? null,
        slug,
        publicId,
        subscriptionId,
        status: "DRAFT",
      });
      return toPublicWebsiteWithPublishingFlags(website);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        const keys =
          err &&
          typeof err === "object" &&
          "keyPattern" in err &&
          (err as { keyPattern?: Record<string, number> }).keyPattern
            ? Object.keys(
                (err as { keyPattern: Record<string, number> }).keyPattern
              )
            : [];
        if (keys.includes("publicId") || keys.includes("subscriptionId")) {
          continue;
        }
        throw new AppError("Slug already taken", 409, "WEBSITE_SLUG_TAKEN");
      }
      throw err;
    }
  }

  throw new AppError(
    "Could not allocate website identity",
    500,
    "WEBSITE_ID_GENERATION_FAILED"
  );
}

export async function listWebsitesForWorkspace(
  workspaceId: string
): Promise<PublicWebsite[]> {
  const websites = await WebsiteModel.find({
    workspaceId: new Types.ObjectId(workspaceId),
  }).sort({ updatedAt: -1 });

  const out: PublicWebsite[] = [];
  for (const website of websites) {
    out.push(
      await toPublicWebsiteWithPublishingFlags(await ensureWebsiteIdentities(website))
    );
  }
  return out;
}

export async function getWebsite(
  workspaceId: string,
  websiteId: string
): Promise<PublicWebsite> {
  return assertWebsiteInWorkspace(workspaceId, websiteId);
}

export async function updateWebsite(
  workspaceId: string,
  websiteId: string,
  input: UpdateWebsiteInput
): Promise<PublicWebsite> {
  await assertWebsiteInWorkspace(workspaceId, websiteId);

  const update: Record<string, unknown> = {};
  if (input.name !== undefined) {
    update.name = input.name.trim();
  }
  if (input.description !== undefined) {
    update.description = input.description;
  }
  if (input.theme !== undefined) {
    const existing = await WebsiteModel.findOne({
      _id: new Types.ObjectId(websiteId),
      workspaceId: new Types.ObjectId(workspaceId),
    }).lean();
    const prev =
      (existing?.theme as Record<string, unknown> | undefined) ?? {};
    update.theme = {
      ...prev,
      ...input.theme,
      colors: {
        ...((prev.colors as Record<string, string>) ?? {}),
        ...(input.theme.colors ?? {}),
      },
      typography: {
        ...((prev.typography as Record<string, string>) ?? {}),
        ...(input.theme.typography ?? {}),
      },
      buttons: {
        ...((prev.buttons as Record<string, string>) ?? {}),
        ...(input.theme.buttons ?? {}),
      },
    };
  }

  const website = await WebsiteModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(websiteId),
      workspaceId: new Types.ObjectId(workspaceId),
    },
    update,
    { new: true }
  );

  if (!website) {
    throw new AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
  }

  return toPublicWebsiteWithPublishingFlags(website);
}

export async function deleteWebsite(
  workspaceId: string,
  websiteId: string
): Promise<void> {
  await assertWebsiteInWorkspace(workspaceId, websiteId);
  await deletePagesForWebsite(websiteId);

  const result = await WebsiteModel.deleteOne({
    _id: new Types.ObjectId(websiteId),
    workspaceId: new Types.ObjectId(workspaceId),
  });

  if (result.deletedCount === 0) {
    throw new AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
  }
}
