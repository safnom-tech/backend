import type { PublicPage } from "../../pages/pages.types.js";
import type { PublicWebsite } from "../../websites/websites.types.js";
import type { BusinessContextInput } from "../ai.types.js";

export function buildWebsiteSummary(
  website: PublicWebsite,
  businessContext?: BusinessContextInput
) {
  return {
    name: businessContext?.businessName ?? website.name,
    description:
      businessContext?.businessDescription ?? website.description ?? undefined,
    category: businessContext?.businessType ?? undefined,
    location: businessContext?.location ?? undefined,
    services: businessContext?.services ?? undefined,
    slug: website.slug,
  };
}

export function buildDesignSystemContext(website: PublicWebsite) {
  const theme = website.theme ?? {};
  return {
    colors: theme.colors ?? {},
    typography: theme.typography ?? {},
    buttons: theme.buttons ?? {},
    containerWidth: "max-w-6xl",
    spacingScale: ["compact", "medium", "large"],
    borderRadius: theme.buttons?.style === "pill" ? "large" : "medium",
  };
}

export function summarizePageSections(page: PublicPage) {
  return page.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      type: s.type,
      order: s.order,
      heading:
        typeof s.data?.heading === "string"
          ? String(s.data.heading).slice(0, 120)
          : typeof s.data?.title === "string"
            ? String(s.data.title).slice(0, 120)
            : undefined,
      variant:
        typeof s.settings?.variant === "string" ? s.settings.variant : undefined,
    }));
}
