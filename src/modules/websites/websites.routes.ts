import { Router } from "express";
import { validateBody, validateParams } from "../../utils/validate.js";
import { pagesRoutes } from "../pages/pages.routes.js";
import { websitesController } from "./websites.controller.js";
import {
  createWebsiteSchema,
  updateWebsiteSchema,
  websiteIdParamSchema,
} from "./websites.validators.js";

const router = Router({ mergeParams: true });

router.post("/", validateBody(createWebsiteSchema), websitesController.create);
router.get("/", websitesController.list);

router.use(
  "/:websiteId/pages",
  validateParams(websiteIdParamSchema),
  pagesRoutes
);

router.get(
  "/:websiteId/preview",
  validateParams(websiteIdParamSchema),
  websitesController.preview
);

router.get(
  "/:websiteId",
  validateParams(websiteIdParamSchema),
  websitesController.getOne
);
router.patch(
  "/:websiteId",
  validateParams(websiteIdParamSchema),
  validateBody(updateWebsiteSchema),
  websitesController.update
);
router.delete(
  "/:websiteId",
  validateParams(websiteIdParamSchema),
  websitesController.delete
);

export { router as websitesRoutes };
