import { Router } from "express";
import { validateBody, validateParams } from "../../utils/validate.js";
import { inquiriesController } from "./inquiries.controller.js";
import {
  publicWebsiteInquiryParamsSchema,
  submitInquiryBodySchema,
} from "./inquiries.validators.js";

const router = Router();

router.post(
  "/websites/:publicId/inquiries",
  validateParams(publicWebsiteInquiryParamsSchema),
  validateBody(submitInquiryBodySchema),
  inquiriesController.publicWebsite
);

export { router as publicInquiriesRoutes };
