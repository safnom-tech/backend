import { Router } from "express";
import { validateParams } from "../../utils/validate.js";
import { mediaController } from "./media.controller.js";
import { publicMediaIdParamSchema } from "./media.validators.js";

const router = Router();

router.get(
  "/media/:mediaId/content",
  validateParams(publicMediaIdParamSchema),
  mediaController.publicContent
);

export { router as publicMediaRoutes };
