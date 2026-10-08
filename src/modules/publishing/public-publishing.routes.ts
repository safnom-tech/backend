import { Router } from "express";
import { validateParams, validateQuery } from "../../utils/validate.js";
import { publicPublishingController } from "./publishing.controller.js";
import {
  publicSiteQuerySchema,
  publicSubdomainParamSchema,
} from "./publishing.validators.js";

const router = Router();

router.get(
  "/sites/:subdomain",
  validateParams(publicSubdomainParamSchema),
  validateQuery(publicSiteQuerySchema),
  publicPublishingController.getSite
);

export { router as publicPublishingRoutes };
