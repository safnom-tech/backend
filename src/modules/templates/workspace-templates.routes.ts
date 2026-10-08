import { Router } from "express";
import { validateParams } from "../../utils/validate.js";
import { templatesController } from "./templates.controller.js";
import { workspaceTemplatePreviewParamsSchema } from "./templates.validators.js";

const router = Router({ mergeParams: true });

router.get(
  "/:templateId/preview",
  validateParams(workspaceTemplatePreviewParamsSchema),
  templatesController.previewForWorkspace
);

export { router as workspaceTemplatesRoutes };
