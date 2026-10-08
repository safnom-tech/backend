import type { PageType } from "../pages/pages.model.js";
import type { SectionTypeConstant } from "../pages/pages.constants.js";
import type { WebsiteTheme } from "../websites/websites.model.js";
import type { WorkspaceBusinessProfile } from "../workspaces/business-profile.types.js";

export type TemplateCategory =
  | "Business"
  | "Agency"
  | "Restaurant"
  | "Portfolio"
  | "Professional Services"
  | "Fashion"
  | "Logistics";

export interface TemplateSectionDefinition {
  type: SectionTypeConstant;
  order: number;
  data: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface TemplatePageDefinition {
  name: string;
  slug: string;
  pageType: PageType;
  seo?: {
    title?: string | null;
    metaDescription?: string | null;
    socialImage?: string | null;
  };
  sections: TemplateSectionDefinition[];
}

export interface TemplateDefinition {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  theme: WebsiteTheme;
  pages: TemplatePageDefinition[];
}

export interface PublicTemplateSummary {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  /** Optional static thumb URL for theme cards (CDN) — avoids live render at scale */
  previewThumbnailUrl?: string | null;
}

export interface TemplateListResult {
  templates: PublicTemplateSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface PublicTemplateDetail extends PublicTemplateSummary {
  theme: WebsiteTheme;
  pages: TemplatePageDefinition[];
}

/** Home page preview with workspace business profile merged into section data */
export interface PublicTemplateThemePreview {
  template: PublicTemplateSummary;
  theme: WebsiteTheme;
  businessProfileApplied: boolean;
  businessProfile: WorkspaceBusinessProfile;
  page: {
    name: string;
    slug: string;
    pageType: PageType;
    seo: {
      title: string | null;
      metaDescription: string | null;
      socialImage: string | null;
    };
    sections: Array<{
      id: string;
      type: SectionTypeConstant;
      order: number;
      data: Record<string, unknown>;
      settings: Record<string, unknown>;
    }>;
  };
}
