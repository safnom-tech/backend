import { Types } from "mongoose";
import { env } from "../../config/env.js";
import { AppError } from "../../middleware/error.middleware.js";
import { isValidSlug } from "../../utils/slugify.js";
import { listPagesForWebsite } from "../pages/pages.service.js";
import type { PublicPage } from "../pages/pages.types.js";
import {
  WebsiteModel,
  type PublishedWebsiteSnapshot,
} from "../websites/websites.model.js";
import {
  assertWebsiteInWorkspace,
  computeHasUnpublishedChanges,
} from "../websites/websites.service.js";
import {
  buildTenantSiteUrl,
  hostFromRequestHeaders,
  resolvePlatformBaseDomain,
} from "./platform-domain.js";
import { isReservedSubdomain } from "./reserved-subdomains.js";
import type {
  PublicSitePage,
  PublicSitePageSummary,
  PublicSitePayload,
  PublishingState,
} from "./publishing.types.js";

function normalizeSubdomainInput(raw: string): string {
  return raw.trim().toLowerCase();
}

function defaultPlatformDomain(): string {
  return env.publishPlatformDomains[0] ?? "safnom.site";
}

export function resolvePlatformDomainForHost(
  requestHost?: string
): string {
  if (requestHost) {
    const fromHost = resolvePlatformBaseDomain(
      requestHost,
      env.publishPlatformDomains
    );
    if (fromHost) return fromHost;
  }
  return defaultPlatformDomain();
}

export function buildPublicSiteUrl(
  subdomain: string,
  platformDomain?: string | null,
  requestHost?: string
): string {
  const platform =
    platformDomain?.trim().toLowerCase() ||
    resolvePlatformDomainForHost(requestHost);

  try {
    const origin = env.publishPublicOrigin.replace(/\/$/, "");
    const url = new URL(origin);
    return buildTenantSiteUrl(subdomain, platform, {
      protocol: url.protocol.replace(/:$/, ""),
      port: url.port || undefined,
    });
  } catch {
    return buildTenantSiteUrl(subdomain, platform);
  }
}

export function resolveRequestHostFromHeaders(
  headers: Parameters<typeof hostFromRequestHeaders>[0]
): string | undefined {
  return hostFromRequestHeaders(headers);
}

async function assertSubdomainAvailable(
  subdomain: string,
  excludeWebsiteId?: string
): Promise<void> {
  const filter: Record<string, unknown> = { subdomain };
  if (excludeWebsiteId && Types.ObjectId.isValid(excludeWebsiteId)) {
    filter._id = { $ne: new Types.ObjectId(excludeWebsiteId) };
  }
  const taken = await WebsiteModel.exists(filter);
  if (taken) {
    throw new AppError(
      "This subdomain is already in use",
      409,
      "SUBDOMAIN_TAKEN"
    );
  }
}

export function validateSubdomainFormat(subdomain: string): string {
  const normalized = normalizeSubdomainInput(subdomain);
  if (!isValidSlug(normalized)) {
    throw new AppError(
      "Invalid or unavailable website",
      400,
      "SUBDOMAIN_INVALID"
    );
  }
  if (isReservedSubdomain(normalized)) {
    throw new AppError("This subdomain is reserved", 400, "SUBDOMAIN_RESERVED");
  }
  return normalized;
}

export async function validateSubdomainForWebsite(
  subdomain: string,
  excludeWebsiteId?: string
): Promise<string> {
  const normalized = validateSubdomainFormat(subdomain);
  await assertSubdomainAvailable(normalized, excludeWebsiteId);
  return normalized;
}

function pageToSnapshotPage(page: PublicPage): PublishedWebsiteSnapshot["pages"][number] {
  return {
    slug: page.slug,
    name: page.name,
    pageType: page.pageType,
    status: page.status,
    seo: {
      title: page.seo.title,
      metaDescription: page.seo.metaDescription,
      socialImage: page.seo.socialImage,
    },
    sections: page.sections.map((s) => ({
      id: s.id,
      type: s.type,
      order: s.order,
      data: s.data,
      settings: s.settings,
    })),
  };
}

export async function buildSnapshot(
  workspaceId: string,
  websiteId: string,
  nextVersion: number
): Promise<PublishedWebsiteSnapshot> {
  const website = await assertWebsiteInWorkspace(workspaceId, websiteId);
  const pages = await listPagesForWebsite(workspaceId, websiteId);
  const publishable = pages.filter((p) => p.status !== "UNPUBLISHED");

  if (publishable.length === 0) {
    throw new AppError(
      "Add at least one page before publishing",
      400,
      "WEBSITE_NOT_PUBLISHABLE"
    );
  }

  return {
    version: nextVersion,
    website: {
      name: website.name,
      description: website.description,
      theme: website.theme,
      settings: website.settings,
    },
    pages: publishable.map(pageToSnapshotPage),
  };
}

function pickPageFromSnapshot(
  snapshot: PublishedWebsiteSnapshot,
  pageSlug?: string
): PublicSitePage {
  const pages = snapshot.pages;
  if (pages.length === 0) {
    throw new AppError("Page not found", 404, "PAGE_NOT_FOUND");
  }

  const requested = pageSlug?.trim().toLowerCase();
  let match: PublishedWebsiteSnapshot["pages"][number] | undefined;

  if (requested) {
    match = pages.find((p) => p.slug === requested);
    if (!match) {
      throw new AppError("Page not found", 404, "PAGE_NOT_FOUND");
    }
  } else {
    match =
      pages.find((p) => p.pageType === "HOME") ??
      pages.find((p) => p.slug === "home") ??
      pages[0];
  }

  return {
    slug: match.slug,
    name: match.name,
    pageType: match.pageType,
    seo: {
      title: match.seo.title ?? null,
      metaDescription: match.seo.metaDescription ?? null,
      socialImage: match.seo.socialImage ?? null,
    },
    sections: match.sections,
  };
}

function toPageSummaries(
  snapshot: PublishedWebsiteSnapshot
): PublicSitePageSummary[] {
  return snapshot.pages.map((p) => ({
    slug: p.slug,
    name: p.name,
    pageType: p.pageType,
    seo: {
      title: p.seo.title ?? null,
      metaDescription: p.seo.metaDescription ?? null,
      socialImage: p.seo.socialImage ?? null,
    },
  }));
}

export async function getPublishingState(
  workspaceId: string,
  websiteId: string,
  requestHost?: string
): Promise<PublishingState> {
  await assertWebsiteInWorkspace(workspaceId, websiteId);
  const doc = await WebsiteModel.findOne({
    _id: new Types.ObjectId(websiteId),
    workspaceId: new Types.ObjectId(workspaceId),
  });
  if (!doc) {
    throw new AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
  }

  const hasUnpublishedChanges = await computeHasUnpublishedChanges(doc);
  const subdomain = doc.subdomain ?? null;
  const platformDomain =
    doc.platformDomain ??
    resolvePlatformDomainForHost(requestHost);

  return {
    websiteId: doc._id.toString(),
    status: doc.status,
    subdomain,
    platformDomain,
    publishedAt: doc.publishedAt ?? null,
    publishedVersion: doc.publishedVersion ?? 0,
    hasUnpublishedChanges,
    publicUrl:
      doc.status === "PUBLISHED" && subdomain
        ? buildPublicSiteUrl(subdomain, doc.platformDomain, requestHost)
        : null,
  };
}

export async function updateSubdomain(
  workspaceId: string,
  websiteId: string,
  subdomain: string,
  requestHost?: string
): Promise<PublishingState> {
  await assertWebsiteInWorkspace(workspaceId, websiteId);
  const normalized = await validateSubdomainForWebsite(subdomain, websiteId);

  const website = await WebsiteModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(websiteId),
      workspaceId: new Types.ObjectId(workspaceId),
    },
    { subdomain: normalized },
    { new: true }
  );

  if (!website) {
    throw new AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
  }

  return getPublishingState(workspaceId, websiteId, requestHost);
}

export async function publishWebsite(
  workspaceId: string,
  websiteId: string,
  input?: { subdomain?: string; requestHost?: string }
): Promise<PublishingState> {
  const publicWebsite = await assertWebsiteInWorkspace(workspaceId, websiteId);
  const doc = await WebsiteModel.findOne({
    _id: new Types.ObjectId(websiteId),
    workspaceId: new Types.ObjectId(workspaceId),
  });
  if (!doc) {
    throw new AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
  }

  let subdomain = doc.subdomain ?? null;
  if (input?.subdomain?.trim()) {
    subdomain = await validateSubdomainForWebsite(input.subdomain, websiteId);
  } else if (!subdomain) {
    subdomain = await validateSubdomainForWebsite(publicWebsite.slug, websiteId);
  } else {
    await validateSubdomainForWebsite(subdomain, websiteId);
  }

  const nextVersion = (doc.publishedVersion ?? 0) + 1;
  const snapshot = await buildSnapshot(workspaceId, websiteId, nextVersion);
  const now = new Date();
  const platformDomain = resolvePlatformDomainForHost(input?.requestHost);

  const updated = await WebsiteModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(websiteId),
      workspaceId: new Types.ObjectId(workspaceId),
    },
    {
      subdomain,
      platformDomain,
      status: "PUBLISHED",
      publishedAt: now,
      publishedVersion: nextVersion,
      publishedSnapshot: snapshot,
    },
    { new: true }
  );

  if (!updated) {
    throw new AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
  }

  return getPublishingState(workspaceId, websiteId, input?.requestHost);
}

export async function unpublishWebsite(
  workspaceId: string,
  websiteId: string,
  requestHost?: string
): Promise<PublishingState> {
  await assertWebsiteInWorkspace(workspaceId, websiteId);

  const updated = await WebsiteModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(websiteId),
      workspaceId: new Types.ObjectId(workspaceId),
    },
    { status: "UNPUBLISHED" },
    { new: true }
  );

  if (!updated) {
    throw new AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
  }

  return getPublishingState(workspaceId, websiteId, requestHost);
}

export async function getPublicSiteBySubdomain(
  subdomain: string,
  pageSlug?: string
): Promise<PublicSitePayload> {
  const normalized = normalizeSubdomainInput(subdomain);
  if (!isValidSlug(normalized) || isReservedSubdomain(normalized)) {
    throw new AppError(
      "Invalid or unavailable website",
      404,
      "WEBSITE_NOT_FOUND"
    );
  }

  const website = await WebsiteModel.findOne({
    subdomain: normalized,
    status: "PUBLISHED",
  }).lean();

  if (!website?.publishedSnapshot) {
    throw new AppError(
      "This website is not currently published",
      404,
      "WEBSITE_NOT_PUBLISHED"
    );
  }

  const snapshot = website.publishedSnapshot as PublishedWebsiteSnapshot;
  const page = pickPageFromSnapshot(snapshot, pageSlug);

  return {
    website: {
      publicId: website.publicId ?? "",
      name: snapshot.website.name,
      description: snapshot.website.description,
      theme: snapshot.website.theme,
    },
    pages: toPageSummaries(snapshot),
    page,
  };
}
