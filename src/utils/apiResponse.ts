import type { Response } from "express";

export interface ApiSuccessBody<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  error: {
    code: string;
    details?: string;
  };
}

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T,
  statusCode = 200
): Response {
  const body: ApiSuccessBody<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  error: { code: string; details?: string },
  statusCode = 500
): Response {
  const body: ApiErrorBody = {
    success: false,
    message,
    error,
  };
  return res.status(statusCode).json(body);
}
