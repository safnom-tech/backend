import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
