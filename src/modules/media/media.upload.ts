import multer from "multer";
import { env } from "../../config/env.js";
import { AppError } from "../../middleware/error.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.mediaMaxFileSizeBytes },
});

export const uploadSingleImage = upload.single("file");

export function handleMulterError(
  err: unknown,
  next: (err: unknown) => void
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      next(new AppError("File too large", 400, "FILE_TOO_LARGE"));
      return;
    }
    next(new AppError("Invalid upload", 400, "INVALID_FILE"));
    return;
  }
  next(err);
}
