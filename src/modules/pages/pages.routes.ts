import { Router } from "express";
import { validateBody, validateParams } from "../../utils/validate.js";
import { pagesController } from "./pages.controller.js";
import {
  createPageSchema,
  createSectionSchema,
  pageIdParamSchema,
  reorderSectionsSchema,
  sectionIdParamSchema,
  updatePageSchema,
  updateSectionSchema,
} from "./pages.validators.js";

const router = Router({ mergeParams: true });

router.post("/", validateBody(createPageSchema), pagesController.create);
router.get("/", pagesController.list);

router.get(
  "/:pageId",
  validateParams(pageIdParamSchema),
  pagesController.getOne
);
router.patch(
  "/:pageId",
  validateParams(pageIdParamSchema),
  validateBody(updatePageSchema),
  pagesController.update
);
router.delete(
  "/:pageId",
  validateParams(pageIdParamSchema),
  pagesController.delete
);

router.post(
  "/:pageId/sections",
  validateParams(pageIdParamSchema),
  validateBody(createSectionSchema),
  pagesController.addSection
);

router.patch(
  "/:pageId/sections/reorder",
  validateParams(pageIdParamSchema),
  validateBody(reorderSectionsSchema),
  pagesController.reorderSections
);

router.post(
  "/:pageId/sections/:sectionId/duplicate",
  validateParams(sectionIdParamSchema),
  pagesController.duplicateSection
);

router.patch(
  "/:pageId/sections/:sectionId",
  validateParams(sectionIdParamSchema),
  validateBody(updateSectionSchema),
  pagesController.updateSection
);

router.delete(
  "/:pageId/sections/:sectionId",
  validateParams(sectionIdParamSchema),
  pagesController.deleteSection
);

export { router as pagesRoutes };
