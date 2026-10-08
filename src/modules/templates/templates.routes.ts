import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateParams, validateQuery } from "../../utils/validate.js";
import { templatesController } from "./templates.controller.js";
import {
  listTemplatesQuerySchema,
  templateIdParamSchema,
} from "./templates.validators.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validateQuery(listTemplatesQuerySchema),
  templatesController.list
);
router.get(
  "/:templateId",
  validateParams(templateIdParamSchema),
  templatesController.getOne
);

export { router as templatesRoutes };
