import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as usersService from "./users.service.js";

export const usersController = {
  getMe: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
        return;
      }
      const user = await usersService.getUserById(req.user.id);
      sendSuccess(res, "Profile retrieved", user);
    } catch (error) {
      next(error);
    }
  },

  updateMe: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
        return;
      }
      const user = await usersService.updateUserProfile(req.user.id, req.body);
      sendSuccess(res, "Profile updated", user);
    } catch (error) {
      next(error);
    }
  },
};
