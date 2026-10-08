import type { WebsiteStatus } from "../websites/websites.model.js";
import type { PublicPageSeo } from "../pages/pages.types.js";
import type { WebsiteTheme } from "../websites/websites.model.js";

export interface PublishingState {
  websiteId: string;
  status: WebsiteStatus;
  subdomain: string | null;
  platformDomain: string | null;
  publishedAt: Date | null;
  publishedVersion: number;
  hasUnpublishedChanges: boolean;
  publicUrl: string | null;
}

export interface PublicSitePageSummary {
  slug: string;
  name: string;
  pageType: string;
  seo: PublicPageSeo;
}

export interface PublicSitePage {
  slug: string;
  name: string;
  pageType: string;
  seo: PublicPageSeo;
  sections: Array<{
    id: string;
    type: string;
    order: number;
    data: Record<string, unknown>;
    settings: Record<string, unknown>;
  }>;
}

export interface PublicSitePayload {
  website: {
    publicId: string;
    name: string;
    description: string | null;
    theme: WebsiteTheme;
  };
  pages: PublicSitePageSummary[];
  page: PublicSitePage;
}
