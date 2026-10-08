import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/apiResponse.js";
import { clearAuthCookie, setAuthCookie } from "../../utils/auth-cookie.js";
import * as authService from "./auth.service.js";

export const authController = {
  signup: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await authService.signup(req.body);
      setAuthCookie(res, result.accessToken);
      sendSuccess(res, "Account created successfully", result.user, 201);
    } catch (error) {
      next(error);
    }
  },

  login: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await authService.login(req.body);
      setAuthCookie(res, result.accessToken);
      sendSuccess(res, "Logged in successfully", result.user);
    } catch (error) {
      next(error);
    }
  },

  firebaseLogin: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await authService.loginWithFirebase(req.body);
      setAuthCookie(res, result.accessToken);
      sendSuccess(res, "Logged in successfully", result.user);
    } catch (error) {
      next(error);
    }
  },

  logout: (_req: Request, res: Response): void => {
    clearAuthCookie(res);
    sendSuccess(res, "Logged out successfully", null);
  },

  forgotPassword: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await authService.forgotPassword(req.body);
      sendSuccess(
        res,
        "If an account exists for that email, a reset link has been sent",
        null
      );
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await authService.resetPassword(req.body);
      sendSuccess(res, "Password reset successfully", null);
    } catch (error) {
      next(error);
    }
  },
};
