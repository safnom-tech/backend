import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { env } from "../config/env.js";
import { AppError } from "./error.middleware.js";

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = req.cookies[env.cookieName] as string | undefined;
  if (!token) {
    next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new AppError("Invalid or expired session", 401, "UNAUTHORIZED"));
  }
}
