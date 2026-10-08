import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../middleware/error.middleware.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((e) => e.message).join("; ");
      next(new AppError(message || "Validation failed", 400, "VALIDATION_ERROR"));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateParams<T extends Record<string, string>>(
  schema: ZodSchema<T>
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const message = result.error.issues.map((e) => e.message).join("; ");
      next(new AppError(message || "Validation failed", 400, "VALIDATION_ERROR"));
      return;
    }
    Object.assign(req.params, result.data);
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = result.error.issues.map((e) => e.message).join("; ");
      next(new AppError(message || "Validation failed", 400, "VALIDATION_ERROR"));
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
}
