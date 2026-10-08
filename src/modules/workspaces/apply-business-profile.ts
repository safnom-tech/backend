import type { SeedPageDefinition } from "../pages/pages.seed.js";
import type { SectionTypeConstant } from "../pages/pages.constants.js";
import {
  businessProfileHasName,
  formatSocialLine,
  type WorkspaceBusinessProfile,
} from "./business-profile.types.js";

function applySectionData(
  type: SectionTypeConstant,
  data: Record<string, unknown>,
  profile: WorkspaceBusinessProfile
): Record<string, unknown> {
  const next = { ...data };
  const name = profile.businessName?.trim();
  if (!name) return next;

  switch (type) {
    case "HEADER":
      next.logoText = name;
      if (profile.tagline?.trim()) next.logoSub = profile.tagline.trim();
      if (profile.phone?.trim()) next.phone = profile.phone.trim();
      if (profile.logoUrl?.trim()) next.logoUrl = profile.logoUrl.trim();
      break;
    case "FOOTER":
      next.logoText = name;
      if (profile.tagline?.trim() && !next.about) {
        next.about = profile.tagline.trim();
      }
      {
        const social = formatSocialLine(profile);
        if (social) {
          next.social = social;
        } else {
          delete next.social;
        }
      }
      if (name) {
        next.copyright = `© ${name}. All rights reserved.`;
      }
      break;
    case "CONTACT":
      if (profile.email?.trim()) next.email = profile.email.trim();
      break;
    default:
      break;
  }
  return next;
}

export function applyBusinessProfileToSeedPages(
  pages: SeedPageDefinition[],
  profile: WorkspaceBusinessProfile
): SeedPageDefinition[] {
  if (!businessProfileHasName(profile)) {
    return pages;
  }

  const name = profile.businessName!.trim();

  return pages.map((page) => ({
    ...page,
    seo: {
      ...page.seo,
      title: page.seo?.title?.replace(/^Ocean Crown[^|]*/i, name) ?? name,
    },
    sections: page.sections.map((section) => ({
      ...section,
      data: applySectionData(section.type, section.data, profile),
    })),
  }));
}
