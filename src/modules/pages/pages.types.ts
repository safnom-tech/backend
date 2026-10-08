import type { Types } from "mongoose";
import type { PageDocument, PageSectionSubdoc, PageStatus, PageType } from "./pages.model.js";

export type SectionType =
  | "HEADER"
  | "HERO"
  | "TEXT"
  | "IMAGE"
  | "SERVICES"
  | "FEATURES"
  | "GALLERY"
  | "TESTIMONIALS"
  | "PRICING"
  | "FAQ"
  | "CONTACT"
  | "FOOTER";

export interface PublicPageSeo {
  title: string | null;
  metaDescription: string | null;
  socialImage: string | null;
}

export interface PublicSection {
  id: string;
  type: SectionType;
  order: number;
  data: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface PublicPage {
  id: string;
  workspaceId: string;
  websiteId: string;
  name: string;
  slug: string;
  pageType: PageType;
  status: PageStatus;
  seo: PublicPageSeo;
  sections: PublicSection[];
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicSection(doc: PageSectionSubdoc): PublicSection {
  return {
    id: doc._id.toString(),
    type: doc.type as SectionType,
    order: doc.order,
    data: (doc.data as Record<string, unknown>) ?? {},
    settings: (doc.settings as Record<string, unknown>) ?? {},
  };
}

export function toPublicPage(doc: PageDocument): PublicPage {
  const sections = [...doc.sections]
    .sort((a, b) => a.order - b.order)
    .map(toPublicSection);

  return {
    id: doc._id.toString(),
    workspaceId: doc.workspaceId.toString(),
    websiteId: doc.websiteId.toString(),
    name: doc.name,
    slug: doc.slug,
    pageType: doc.pageType,
    status: doc.status,
    seo: {
      title: doc.seo?.title ?? null,
      metaDescription: doc.seo?.metaDescription ?? null,
      socialImage: doc.seo?.socialImage ?? null,
    },
    sections,
    createdAt: doc.createdAt ?? new Date(),
    updatedAt: doc.updatedAt ?? new Date(),
  };
}

export function toPublicPageFromLean(doc: {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  websiteId: Types.ObjectId;
  name: string;
  slug: string;
  pageType: PageType;
  status: PageStatus;
  seo?: {
    title?: string | null;
    metaDescription?: string | null;
    socialImage?: string | null;
  };
  sections: PageSectionSubdoc[];
  createdAt?: Date;
  updatedAt?: Date;
}): PublicPage {
  const sections = [...doc.sections]
    .sort((a, b) => a.order - b.order)
    .map(toPublicSection);

  return {
    id: doc._id.toString(),
    workspaceId: doc.workspaceId.toString(),
    websiteId: doc.websiteId.toString(),
    name: doc.name,
    slug: doc.slug,
    pageType: doc.pageType,
    status: doc.status,
    seo: {
      title: doc.seo?.title ?? null,
      metaDescription: doc.seo?.metaDescription ?? null,
      socialImage: doc.seo?.socialImage ?? null,
    },
    sections,
    createdAt: doc.createdAt ?? new Date(),
    updatedAt: doc.updatedAt ?? new Date(),
  };
}
