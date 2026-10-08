import { z } from "zod";

export const submitInquiryBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(1).max(5000),
});

export const publicWebsiteInquiryParamsSchema = z.object({
  publicId: z.string().trim().min(1).max(32),
});
