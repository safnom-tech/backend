import { Types } from "mongoose";
import { AppError } from "../../middleware/error.middleware.js";
import { isValidSlug, slugifyName } from "../../utils/slugify.js";
import { assertWebsiteInWorkspace } from "../websites/websites.service.js";
import { PageModel } from "./pages.model.js";
import {
  toPublicPage,
  toPublicSection,
  type PublicPage,
  type PublicSection,
} from "./pages.types.js";
import type {
  CreatePageInput,
  CreateSectionInput,
  UpdatePageInput,
  UpdateSectionInput,
} from "./pages.validators.js";

async function generateUniquePageSlug(
  websiteId: string,
  baseName: string
): Promise<string> {
  let base = slugifyName(baseName) || "page";
  if (!isValidSlug(base)) {
    base = "page";
  }
  let candidate = base;
  let suffix = 2;
  while (
    await PageModel.exists({
      websiteId: new Types.ObjectId(websiteId),
      slug: candidate,
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
    if (suffix > 100) {
      throw new AppError("Could not generate slug", 409, "PAGE_SLUG_TAKEN");
    }
  }
  return candidate;
}

export async function assertPageInWebsite(
  workspaceId: string,
  websiteId: string,
  pageId: string
): Promise<PublicPage> {
  await assertWebsiteInWorkspace(workspaceId, websiteId);

  if (!Types.ObjectId.isValid(pageId)) {
    throw new AppError("Page not found", 404, "PAGE_NOT_FOUND");
  }

  const page = await PageModel.findOne({
    _id: new Types.ObjectId(pageId),
    workspaceId: new Types.ObjectId(workspaceId),
    websiteId: new Types.ObjectId(websiteId),
  });

  if (!page) {
    throw new AppError("Page not found", 404, "PAGE_NOT_FOUND");
  }

  return toPublicPage(page);
}

async function loadPageDoc(
  workspaceId: string,
  websiteId: string,
  pageId: string
) {
  await assertWebsiteInWorkspace(workspaceId, websiteId);

  if (!Types.ObjectId.isValid(pageId)) {
    throw new AppError("Page not found", 404, "PAGE_NOT_FOUND");
  }

  const page = await PageModel.findOne({
    _id: new Types.ObjectId(pageId),
    workspaceId: new Types.ObjectId(workspaceId),
    websiteId: new Types.ObjectId(websiteId),
  });

  if (!page) {
    throw new AppError("Page not found", 404, "PAGE_NOT_FOUND");
  }

  return page;
}

function nextSectionOrder(page: { sections: { order: number }[] }): number {
  if (page.sections.length === 0) return 0;
  return Math.max(...page.sections.map((s) => s.order)) + 1;
}

export async function createPage(
  workspaceId: string,
  websiteId: string,
  input: CreatePageInput
): Promise<PublicPage> {
  await assertWebsiteInWorkspace(workspaceId, websiteId);

  const slug =
    input.slug?.trim() ||
    (await generateUniquePageSlug(websiteId, input.name));

  if (!isValidSlug(slug)) {
    throw new AppError("Invalid slug", 400, "VALIDATION_ERROR");
  }

  try {
    const page = await PageModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      websiteId: new Types.ObjectId(websiteId),
      name: input.name.trim(),
      slug: slug.toLowerCase(),
      pageType: input.pageType ?? "CUSTOM",
      status: "DRAFT",
      seo: {
        title: input.seo?.title ?? null,
        metaDescription: input.seo?.metaDescription ?? null,
        socialImage: input.seo?.socialImage ?? null,
      },
      sections: [],
    });
    return toPublicPage(page);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      throw new AppError("Slug already taken", 409, "PAGE_SLUG_TAKEN");
    }
    throw err;
  }
}

export async function listPagesForWebsite(
  workspaceId: string,
  websiteId: string
): Promise<PublicPage[]> {
  await assertWebsiteInWorkspace(workspaceId, websiteId);

  const pages = await PageModel.find({
    workspaceId: new Types.ObjectId(workspaceId),
    websiteId: new Types.ObjectId(websiteId),
  }).sort({ updatedAt: -1 });

  return pages.map((p) => toPublicPage(p));
}

export async function getPage(
  workspaceId: string,
  websiteId: string,
  pageId: string
): Promise<PublicPage> {
  return assertPageInWebsite(workspaceId, websiteId, pageId);
}

export async function updatePage(
  workspaceId: string,
  websiteId: string,
  pageId: string,
  input: UpdatePageInput
): Promise<PublicPage> {
  const page = await loadPageDoc(workspaceId, websiteId, pageId);

  if (input.name !== undefined) {
    page.name = input.name.trim();
  }
  if (input.slug !== undefined) {
    const slug = input.slug.trim().toLowerCase();
    if (!isValidSlug(slug)) {
      throw new AppError("Invalid slug", 400, "VALIDATION_ERROR");
    }
    page.slug = slug;
  }
  if (input.pageType !== undefined) {
    page.pageType = input.pageType;
  }
  if (input.status !== undefined) {
    page.status = input.status;
  }
  if (input.seo !== undefined) {
    page.seo = {
      title: input.seo.title ?? page.seo?.title ?? null,
      metaDescription:
        input.seo.metaDescription ?? page.seo?.metaDescription ?? null,
      socialImage: input.seo.socialImage ?? page.seo?.socialImage ?? null,
    };
  }

  try {
    await page.save();
    return toPublicPage(page);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      throw new AppError("Slug already taken", 409, "PAGE_SLUG_TAKEN");
    }
    throw err;
  }
}

export async function deletePage(
  workspaceId: string,
  websiteId: string,
  pageId: string
): Promise<void> {
  const result = await PageModel.deleteOne({
    _id: new Types.ObjectId(pageId),
    workspaceId: new Types.ObjectId(workspaceId),
    websiteId: new Types.ObjectId(websiteId),
  });

  if (result.deletedCount === 0) {
    throw new AppError("Page not found", 404, "PAGE_NOT_FOUND");
  }
}

export async function deletePagesForWebsite(websiteId: string): Promise<void> {
  await PageModel.deleteMany({
    websiteId: new Types.ObjectId(websiteId),
  });
}

export async function addSection(
  workspaceId: string,
  websiteId: string,
  pageId: string,
  input: CreateSectionInput
): Promise<PublicSection> {
  const page = await loadPageDoc(workspaceId, websiteId, pageId);

  const order =
    input.order ?? nextSectionOrder(page);

  page.sections.push({
    _id: new Types.ObjectId(),
    type: input.type,
    order,
    data: input.data ?? {},
    settings: input.settings ?? {},
  });

  await page.save();
  const added = page.sections[page.sections.length - 1];
  return toPublicSection(added);
}

export async function updateSection(
  workspaceId: string,
  websiteId: string,
  pageId: string,
  sectionId: string,
  input: UpdateSectionInput
): Promise<PublicSection> {
  const page = await loadPageDoc(workspaceId, websiteId, pageId);

  const section = page.sections.id(sectionId);
  if (!section) {
    throw new AppError("Section not found", 404, "SECTION_NOT_FOUND");
  }

  if (input.type !== undefined) {
    section.type = input.type;
  }
  if (input.order !== undefined) {
    section.order = input.order;
  }
  if (input.data !== undefined) {
    section.data = input.data;
  }
  if (input.settings !== undefined) {
    section.settings = input.settings;
  }

  await page.save();
  return toPublicSection(section);
}

export async function deleteSection(
  workspaceId: string,
  websiteId: string,
  pageId: string,
  sectionId: string
): Promise<void> {
  const page = await loadPageDoc(workspaceId, websiteId, pageId);

  const section = page.sections.id(sectionId);
  if (!section) {
    throw new AppError("Section not found", 404, "SECTION_NOT_FOUND");
  }

  section.deleteOne();
  await page.save();
}

export async function duplicateSection(
  workspaceId: string,
  websiteId: string,
  pageId: string,
  sectionId: string
): Promise<PublicSection> {
  const page = await loadPageDoc(workspaceId, websiteId, pageId);

  const source = page.sections.id(sectionId);
  if (!source) {
    throw new AppError("Section not found", 404, "SECTION_NOT_FOUND");
  }

  const order = source.order + 1;
  for (const s of page.sections) {
    if (s.order > source.order) {
      s.order += 1;
    }
  }

  page.sections.push({
    _id: new Types.ObjectId(),
    type: source.type,
    order,
    data: { ...(source.data as Record<string, unknown>) },
    settings: { ...(source.settings as Record<string, unknown>) },
  });

  await page.save();
  const dup = page.sections[page.sections.length - 1];
  return toPublicSection(dup);
}

export async function reorderSections(
  workspaceId: string,
  websiteId: string,
  pageId: string,
  sectionIds: string[]
): Promise<PublicSection[]> {
  const page = await loadPageDoc(workspaceId, websiteId, pageId);

  const idSet = new Set(sectionIds);
  if (idSet.size !== sectionIds.length) {
    throw new AppError("Duplicate section IDs", 400, "VALIDATION_ERROR");
  }

  if (idSet.size !== page.sections.length) {
    throw new AppError(
      "sectionIds must include every section on the page",
      400,
      "VALIDATION_ERROR"
    );
  }

  for (const sid of sectionIds) {
    if (!page.sections.id(sid)) {
      throw new AppError("Section not found", 404, "SECTION_NOT_FOUND");
    }
  }

  sectionIds.forEach((sid, index) => {
    const section = page.sections.id(sid);
    if (section) {
      section.order = index;
    }
  });

  await page.save();
  return [...page.sections]
    .sort((a, b) => a.order - b.order)
    .map(toPublicSection);
}
