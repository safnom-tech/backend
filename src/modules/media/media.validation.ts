import { env } from "../../config/env.js";
import { AppError } from "../../middleware/error.middleware.js";

export type DetectedImage = {
  mimeType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  extension: "jpg" | "png" | "gif" | "webp";
};

export function sanitizeOriginalFilename(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "upload";
  const cleaned = base.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 200);
  return cleaned || "upload";
}

export function detectImageType(buffer: Buffer): DetectedImage | null {
  if (buffer.length < 12) return null;

  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mimeType: "image/png", extension: "png" };
  }

  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { mimeType: "image/gif", extension: "gif" };
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mimeType: "image/webp", extension: "webp" };
  }

  return null;
}

export function validateUploadBuffer(
  buffer: Buffer,
  _clientMime?: string
): DetectedImage {
  if (!buffer.length) {
    throw new AppError("Empty file", 400, "INVALID_FILE");
  }
  if (buffer.length > env.mediaMaxFileSizeBytes) {
    throw new AppError("File too large", 400, "FILE_TOO_LARGE");
  }
  const detected = detectImageType(buffer);
  if (!detected) {
    throw new AppError("Invalid image type", 400, "INVALID_FILE_TYPE");
  }
  return detected;
}
