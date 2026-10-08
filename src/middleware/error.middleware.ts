import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import type { ApiErrorBody } from "../utils/apiResponse.js";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_SERVER_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      success: false,
      message: err.message,
      error: {
        code: err.code,
        ...(!env.isProduction && { details: err.message }),
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  logger.error({ err }, "Unhandled application error");

  const body: ApiErrorBody = {
    success: false,
    message: env.isProduction ? "Something went wrong" : err.message,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      ...(!env.isProduction && { details: err.message }),
    },
  };

  res.status(500).json(body);
}
