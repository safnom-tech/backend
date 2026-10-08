import { Router } from "express";
import { validateBody } from "../../utils/validate.js";
import { aiController } from "./ai.controller.js";
import {
  composedSectionEditBodySchema,
  composedSectionGenerateBodySchema,
  composedSectionRegenerateBodySchema,
  fieldContentGenerateBodySchema,
  generateWebsiteBodySchema,
  sectionActionBodySchema,
} from "./ai.validators.js";

const router = Router({ mergeParams: true });

router.post(
  "/website/generate",
  validateBody(generateWebsiteBodySchema),
  aiController.generateWebsite
);
router.post(
  "/section/action",
  validateBody(sectionActionBodySchema),
  aiController.sectionAction
);
router.post(
  "/sections/generate",
  validateBody(composedSectionGenerateBodySchema),
  aiController.generateComposedSection
);
router.post(
  "/sections/regenerate",
  validateBody(composedSectionRegenerateBodySchema),
  aiController.regenerateComposedSection
);
router.post(
  "/sections/edit",
  validateBody(composedSectionEditBodySchema),
  aiController.editComposedSection
);
router.post(
  "/content/generate",
  validateBody(fieldContentGenerateBodySchema),
  aiController.generateFieldContent
);

export { router as aiRoutes };
