import { z } from "zod";

export const mediaIdParamSchema = z.object({
  workspaceId: z.string().min(1),
  mediaId: z.string().min(1),
});

export const listMediaQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
