import { z } from "zod";
import { SECTION_TYPES } from "../pages/pages.constants.js";
import {
  COMPOSED_DESIGN_STYLES,
  COMPOSED_SECTION_TYPE_HINTS,
} from "./composed/composed-section.catalog.js";
import { COMPOSED_LAYOUT_PRESET_IDS } from "./composed/composed-layout.presets.js";
import { FIELD_CONTENT_TYPES } from "./content/field-content.limits.js";
import { composedSectionDefinitionSchema } from "./composed/composed-section.schema.js";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const generateWebsiteBodySchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  businessType: z.string().trim().min(1).max(120),
  businessDescription: z.string().trim().min(1).max(4000),
  location: z.string().trim().min(1).max(200),
  services: z.array(z.string().trim().min(1).max(120)).min(1).max(30),
  websiteStyle: z.string().trim().min(1).max(500),
});

export const sectionActionBodySchema = z
  .object({
    action: z.enum([
      "generate",
      "rewrite",
      "shorten",
      "professional",
      "generate_about",
      "generate_services",
      "generate_faqs",
      "create_from_prompt",
      "edit_from_prompt",
      "seo_title",
      "seo_description",
    ]),
    websiteId: z.string().regex(objectIdRegex),
    pageId: z.string().regex(objectIdRegex),
    sectionId: z.string().regex(objectIdRegex).optional(),
    sectionType: z.enum(SECTION_TYPES).optional(),
    content: z.record(z.string(), z.unknown()).optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
    prompt: z.string().trim().min(1).max(2000).optional(),
    businessContext: z
      .object({
        businessName: z.string().trim().max(120).optional(),
        businessType: z.string().trim().max(120).optional(),
        businessDescription: z.string().trim().max(4000).optional(),
        location: z.string().trim().max(200).optional(),
        services: z.array(z.string().trim().max(120)).max(30).optional(),
        websiteStyle: z.string().trim().max(500).optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const seo = data.action === "seo_title" || data.action === "seo_description";
    const create = data.action === "create_from_prompt";
    const editPrompt = data.action === "edit_from_prompt";
    if (create && !data.prompt) {
      ctx.addIssue({
        code: "custom",
        message: "prompt is required for create_from_prompt",
        path: ["prompt"],
      });
    }
    if (editPrompt && !data.prompt) {
      ctx.addIssue({
        code: "custom",
        message: "prompt is required for edit_from_prompt",
        path: ["prompt"],
      });
    }
    if (seo || create) return;
    if (!data.sectionType) {
      ctx.addIssue({
        code: "custom",
        message: "sectionType is required for this action",
        path: ["sectionType"],
      });
    }
    if (!data.sectionId) {
      ctx.addIssue({
        code: "custom",
        message: "sectionId is required for section actions",
        path: ["sectionId"],
      });
    }
  });

const businessContextSchema = z
  .object({
    businessName: z.string().trim().max(120).optional(),
    businessType: z.string().trim().max(120).optional(),
    businessDescription: z.string().trim().max(4000).optional(),
    location: z.string().trim().max(200).optional(),
    services: z.array(z.string().trim().max(120)).max(30).optional(),
    websiteStyle: z.string().trim().max(500).optional(),
  })
  .optional();

const composedSectionBaseSchema = z.object({
  websiteId: z.string().regex(objectIdRegex),
  pageId: z.string().regex(objectIdRegex),
  prompt: z.string().trim().min(1).max(8000),
  sectionTypeHint: z.enum(COMPOSED_SECTION_TYPE_HINTS).optional(),
  designStyle: z.enum(COMPOSED_DESIGN_STYLES).optional(),
  additionalRequirements: z.array(z.string().trim().max(200)).max(20).optional(),
  layoutPresetId: z.enum(COMPOSED_LAYOUT_PRESET_IDS).optional(),
  businessContext: businessContextSchema,
});

export const composedSectionGenerateBodySchema = composedSectionBaseSchema;

export const composedSectionRegenerateBodySchema = composedSectionBaseSchema.extend({
  currentSection: composedSectionDefinitionSchema,
});

export const composedSectionEditBodySchema = composedSectionRegenerateBodySchema;

export const fieldContentGenerateBodySchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  fieldType: z.enum(FIELD_CONTENT_TYPES),
  maxChars: z.number().int().min(1).max(8000).optional(),
  maxWords: z.number().int().min(1).max(800).optional(),
  currentValue: z.string().max(8000).optional(),
  regenerate: z.boolean().optional(),
  businessContext: businessContextSchema,
});
