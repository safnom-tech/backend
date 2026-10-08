import { Router } from "express";
import { validateParams, validateQuery } from "../../utils/validate.js";
import { mediaController } from "./media.controller.js";
import {
  handleMulterError,
  uploadSingleImage,
} from "./media.upload.js";
import { listMediaQuerySchema, mediaIdParamSchema } from "./media.validators.js";

const router = Router({ mergeParams: true });

function withUpload(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
): void {
  uploadSingleImage(req, res, (err) => {
    if (err) {
      handleMulterError(err, next);
      return;
    }
    next();
  });
}

router.post("/", withUpload, mediaController.create);
router.get("/", validateQuery(listMediaQuerySchema), mediaController.list);
router.get(
  "/:mediaId/content",
  validateParams(mediaIdParamSchema),
  mediaController.content
);
router.get(
  "/:mediaId",
  validateParams(mediaIdParamSchema),
  mediaController.getOne
);
router.patch(
  "/:mediaId",
  validateParams(mediaIdParamSchema),
  withUpload,
  mediaController.replace
);
router.delete(
  "/:mediaId",
  validateParams(mediaIdParamSchema),
  mediaController.delete
);

export { router as mediaRoutes };
