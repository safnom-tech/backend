import type { PublicPage } from "../pages/pages.types.js";
import type { PublicWebsite } from "../websites/websites.types.js";

export type AiSectionAction =
  | "generate"
  | "rewrite"
  | "shorten"
  | "professional"
  | "generate_about"
  | "generate_services"
  | "generate_faqs"
  | "create_from_prompt"
  | "edit_from_prompt"
  | "seo_title"
  | "seo_description";

export interface BusinessContextInput {
  businessName?: string;
  businessType?: string;
  businessDescription?: string;
  location?: string;
  services?: string[];
  websiteStyle?: string;
}

export interface GenerateWebsiteInput {
  businessName: string;
  businessType: string;
  businessDescription: string;
  location: string;
  services: string[];
  websiteStyle: string;
}

export interface SectionActionInput {
  action: AiSectionAction;
  websiteId: string;
  pageId: string;
  sectionId?: string;
  sectionType?: string;
  content?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  prompt?: string;
  businessContext?: BusinessContextInput;
}

export interface GenerateWebsiteResult {
  website: PublicWebsite;
  pages: PublicPage[];
}
