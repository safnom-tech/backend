import type { Request, Response } from "express";
import { sendError } from "../utils/apiResponse.js";

export function notFoundMiddleware(_req: Request, res: Response): void {
  sendError(
    res,
    "Route not found",
    { code: "NOT_FOUND" },
    404
  );
}
