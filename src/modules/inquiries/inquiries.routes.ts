import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../utils/validate.js";
import { inquiriesController } from "./inquiries.controller.js";
import { submitInquiryBodySchema } from "./inquiries.validators.js";

const objectIdRegex = /^[a-f\d]{24}$/i;

const workspaceSubmitSchema = submitInquiryBodySchema.extend({
  websiteId: z.preprocess(
    (val) => {
      if (val === null || val === undefined) return undefined;
      if (typeof val !== "string") return val;
      const trimmed = val.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().regex(objectIdRegex, "Invalid website ID").optional()
  ),
});

const router = Router({ mergeParams: true });

router.post(
  "/",
  validateBody(workspaceSubmitSchema),
  inquiriesController.workspace
);

export { router as workspaceInquiriesRoutes };
