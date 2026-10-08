import { z } from "zod";
import { PAGE_STATUSES, PAGE_TYPES } from "./pages.model.js";
import { SECTION_TYPES } from "./pages.constants.js";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const pageIdParamSchema = z.object({
  pageId: z.string().regex(objectIdRegex, "Invalid page ID"),
});

export const pageAndWebsiteParamSchema = z.object({
  websiteId: z.string().regex(objectIdRegex, "Invalid website ID"),
  pageId: z.string().regex(objectIdRegex, "Invalid page ID"),
});

export const sectionIdParamSchema = pageAndWebsiteParamSchema.extend({
  sectionId: z.string().regex(objectIdRegex, "Invalid section ID"),
});

const seoSchema = z.object({
  title: z.string().trim().max(120).nullable().optional(),
  metaDescription: z.string().trim().max(320).nullable().optional(),
  socialImage: z.string().trim().max(2048).nullable().optional(),
});

export const createPageSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z.string().trim().min(1).max(80).optional(),
  pageType: z.enum(PAGE_TYPES).optional(),
  seo: seoSchema.optional(),
});

export const updatePageSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: z.string().trim().min(1).max(80).optional(),
    pageType: z.enum(PAGE_TYPES).optional(),
    status: z.enum(PAGE_STATUSES).optional(),
    seo: seoSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const createSectionSchema = z.object({
  type: z.enum(SECTION_TYPES),
  order: z.number().int().min(0).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const updateSectionSchema = z
  .object({
    type: z.enum(SECTION_TYPES).optional(),
    order: z.number().int().min(0).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const reorderSectionsSchema = z.object({
  sectionIds: z
    .array(z.string().regex(objectIdRegex, "Invalid section ID"))
    .min(1),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
