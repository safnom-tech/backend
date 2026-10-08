import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const publishingParamsSchema = z.object({
  workspaceId: z.string().regex(objectIdRegex, "Invalid workspace ID"),
  websiteId: z.string().regex(objectIdRegex, "Invalid website ID"),
});

export const publishBodySchema = z.object({
  subdomain: z.string().trim().min(1).max(64).optional(),
});

export const updateSubdomainBodySchema = z.object({
  subdomain: z.string().trim().min(1).max(64),
});

export const publicSubdomainParamSchema = z.object({
  subdomain: z.string().trim().min(1).max(64),
});

export const publicSiteQuerySchema = z.object({
  pageSlug: z.string().trim().min(1).max(120).optional(),
  slug: z.string().trim().min(1).max(120).optional(),
});
