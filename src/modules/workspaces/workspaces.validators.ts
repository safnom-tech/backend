import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")
    .optional(),
});

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .or(z.literal(""));

export const businessProfileSchema = z.object({
  businessName: z.string().trim().max(120).optional(),
  tagline: z.string().trim().max(200).optional(),
  logoUrl: z.string().trim().max(2048).nullable().optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.union([z.string().trim().email().max(200), z.literal("")]).optional(),
  address: z.string().trim().max(500).optional(),
  socialTwitter: optionalUrl,
  socialFacebook: optionalUrl,
  socialInstagram: optionalUrl,
  socialLinkedin: optionalUrl,
});

export const updateWorkspaceSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    businessProfile: businessProfileSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.businessProfile !== undefined, {
    message: "At least one field is required",
  });

export const workspaceIdParamSchema = z.object({
  workspaceId: z.string().regex(objectIdRegex, "Invalid workspace ID"),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
