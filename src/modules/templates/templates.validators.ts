import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const workspaceTemplatePreviewParamsSchema = z.object({
  workspaceId: z.string().regex(objectIdRegex, "Invalid workspace ID"),
  templateId: z.string().trim().min(1).max(80),
});

export const listTemplatesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const templateIdParamSchema = z.object({
  templateId: z.string().trim().min(1).max(80),
});
