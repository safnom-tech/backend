import { Router } from "express";
import { validateBody, validateParams } from "../../utils/validate.js";
import { publishingController } from "./publishing.controller.js";
import {
  publishBodySchema,
  publishingParamsSchema,
  updateSubdomainBodySchema,
} from "./publishing.validators.js";

const router = Router({ mergeParams: true });

router.post(
  "/:websiteId/publish",
  validateParams(publishingParamsSchema),
  validateBody(publishBodySchema),
  publishingController.publish
);

router.post(
  "/:websiteId/unpublish",
  validateParams(publishingParamsSchema),
  publishingController.unpublish
);

router.get(
  "/:websiteId/publishing",
  validateParams(publishingParamsSchema),
  publishingController.getState
);

router.patch(
  "/:websiteId/publishing",
  validateParams(publishingParamsSchema),
  validateBody(updateSubdomainBodySchema),
  publishingController.patchSubdomain
);

export { router as publishingWebsiteRoutes };
