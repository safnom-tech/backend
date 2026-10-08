import type { NextFunction, Request, Response } from "express";
import { AppError } from "../middleware/error.middleware.js";

export function notImplementedHandler(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(new AppError("Not implemented", 501, "NOT_IMPLEMENTED"));
}
