import { Router } from "express";
import { validateBody } from "../../utils/validate.js";
import { authController } from "./auth.controller.js";
import {
  firebaseLoginSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "./auth.validators.js";

const router = Router();

router.post("/signup", validateBody(signupSchema), authController.signup);
router.post("/login", validateBody(loginSchema), authController.login);
router.post(
  "/firebase",
  validateBody(firebaseLoginSchema),
  authController.firebaseLogin
);
router.post("/logout", authController.logout);
router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

export { router as authRoutes };
