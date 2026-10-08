import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../../utils/validate.js";
import { workspacesController } from "./workspaces.controller.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdParamSchema,
} from "./workspaces.validators.js";

const router = Router();

router.use(requireAuth);

router.post("/", validateBody(createWorkspaceSchema), workspacesController.create);
router.get("/", workspacesController.list);
router.get("/current", workspacesController.getCurrent);

router.get(
  "/:workspaceId",
  validateParams(workspaceIdParamSchema),
  workspacesController.getOne
);
router.patch(
  "/:workspaceId",
  validateParams(workspaceIdParamSchema),
  validateBody(updateWorkspaceSchema),
  workspacesController.update
);
router.post(
  "/:workspaceId/select",
  validateParams(workspaceIdParamSchema),
  workspacesController.select
);

export { router as workspacesRoutes };
