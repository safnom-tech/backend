import { AppError } from "../../middleware/error.middleware.js";
import { getTemplateCache } from "../../cache/template-cache.js";
import { applyBusinessProfileToSeedPages } from "../workspaces/apply-business-profile.js";
import { getWorkspaceBusinessProfile } from "../workspaces/workspaces.service.js";
import { seedWebsiteContent } from "../pages/pages.seed.js";
import { assertWebsiteInWorkspace } from "../websites/websites.service.js";
import { WebsiteModel } from "../websites/websites.model.js";
import { toPublicWebsite, type PublicWebsite } from "../websites/websites.types.js";
import { Types } from "mongoose";
import { getTemplateRepository } from "./template.repository.js";
import {
  PREVIEW_CACHE_TTL_SECONDS,
  previewCacheKey,
} from "./template-preview-cache.js";
import type {
  PublicTemplateDetail,
  PublicTemplateSummary,
  PublicTemplateThemePreview,
  TemplateListResult,
} from "./templates.types.js";

export async function listTemplates(input?: {
  limit?: number;
  offset?: number;
}): Promise<TemplateListResult> {
  return getTemplateRepository().list(input);
}

export async function getTemplateById(
  templateId: string
): Promise<PublicTemplateDetail> {
  const template = await getTemplateRepository().getDefinition(templateId);
  return {
    id: template.id,
    name: template.name,
    category: template.category,
    description: template.description,
    theme: template.theme,
    pages: template.pages,
  };
}

export async function getTemplatePreviewForWorkspace(
  workspaceId: string,
  templateId: string
): Promise<PublicTemplateThemePreview> {
  const businessProfile = await getWorkspaceBusinessProfile(workspaceId);
  const cache = getTemplateCache();
  const cacheKey = previewCacheKey(workspaceId, templateId, businessProfile);
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached) as PublicTemplateThemePreview;
  }

  const template = await getTemplateRepository().getDefinition(templateId);
  const pages = applyBusinessProfileToSeedPages(
    template.pages,
    businessProfile
  );
  const home =
    pages.find((p) => p.slug === "home") ??
    pages.find((p) => p.pageType === "HOME") ??
    pages[0];

  if (!home) {
    throw new AppError("Template has no pages", 404, "TEMPLATE_NOT_FOUND");
  }

  const applied = Boolean(businessProfile.businessName?.trim());

  const payload: PublicTemplateThemePreview = {
    template: {
      id: template.id,
      name: template.name,
      category: template.category,
      description: template.description,
    },
    theme: template.theme,
    businessProfileApplied: applied,
    businessProfile,
    page: {
      name: home.name,
      slug: home.slug,
      pageType: home.pageType ?? "CUSTOM",
      seo: {
        title: home.seo?.title ?? null,
        metaDescription: home.seo?.metaDescription ?? null,
        socialImage: home.seo?.socialImage ?? null,
      },
      sections: home.sections.map((section, index) => ({
        id: `tpl-preview-${index}`,
        type: section.type,
        order: section.order,
        data: section.data,
        settings: section.settings,
      })),
    },
  };

  await cache.set(cacheKey, JSON.stringify(payload), PREVIEW_CACHE_TTL_SECONDS);
  return payload;
}

export async function applyTemplateToWebsite(
  workspaceId: string,
  websiteId: string,
  templateId: string
): Promise<PublicWebsite> {
  await assertWebsiteInWorkspace(workspaceId, websiteId);
  const template = await getTemplateRepository().getDefinition(templateId);
  const businessProfile = await getWorkspaceBusinessProfile(workspaceId);
  const pages = applyBusinessProfileToSeedPages(
    template.pages,
    businessProfile
  );

  await seedWebsiteContent(workspaceId, websiteId, {
    theme: template.theme,
    pages,
  });

  const website = await WebsiteModel.findOne({
    _id: new Types.ObjectId(websiteId),
    workspaceId: new Types.ObjectId(workspaceId),
  });

  if (!website) {
    throw new AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
  }

  const { computeHasUnpublishedChanges } = await import(
    "../websites/websites.service.js"
  );
  const hasUnpublishedChanges = await computeHasUnpublishedChanges(website);
  return toPublicWebsite(website, { hasUnpublishedChanges });
}

export type { PublicTemplateSummary };
