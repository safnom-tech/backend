import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../utils/validate.js";
import { usersController } from "./users.controller.js";
import { updateProfileSchema } from "./users.validators.js";

const router = Router();

router.get("/me", requireAuth, usersController.getMe);
router.patch(
  "/me",
  requireAuth,
  validateBody(updateProfileSchema),
  usersController.updateMe
);

export { router as usersRoutes };
