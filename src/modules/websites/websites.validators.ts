import { z } from "zod";
const objectIdRegex = /^[a-f\d]{24}$/i;

export const createWebsiteSchema = z.object({
  /** Falls back to workspace business profile name when omitted */
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  templateId: z.string().trim().min(1).max(80).optional(),
});

const themeSchema = z
  .object({
    colors: z.record(z.string(), z.string()).optional(),
    typography: z.record(z.string(), z.string()).optional(),
    buttons: z.record(z.string(), z.string()).optional(),
  })
  .optional();

export const updateWebsiteSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    theme: themeSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const websiteIdParamSchema = z.object({
  websiteId: z.string().regex(objectIdRegex, "Invalid website ID"),
});

export type CreateWebsiteInput = z.infer<typeof createWebsiteSchema>;
export type UpdateWebsiteInput = z.infer<typeof updateWebsiteSchema>;
