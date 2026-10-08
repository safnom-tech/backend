import { AppError } from "../../middleware/error.middleware.js";
import { enforceFieldContentLimit } from "./content/field-content.limits.js";

const UNSAFE_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<\/?iframe/i,
];

export function sanitizePlainText(
  value: string,
  maxLen: number,
  field = "text",
  options?: { completeSentences?: boolean }
): string {
  let s = value.trim();
  if (s.length > maxLen) {
    s = enforceFieldContentLimit(
      s,
      { maxChars: maxLen },
      { completeSentences: options?.completeSentences }
    );
  }
  for (const re of UNSAFE_PATTERNS) {
    if (re.test(s)) {
      throw new AppError(`Unsafe content in ${field}`, 400, "VALIDATION_ERROR");
    }
  }
  return s;
}

export function sanitizeUrlField(value: string, field: string): string {
  const s = value.trim().slice(0, 2048);
  if (!s) return "";
  if (s.startsWith("#")) return sanitizePlainText(s, 256, field);
  if (s.startsWith("http://") || s.startsWith("https://")) {
    return sanitizePlainText(s, 2048, field);
  }
  throw new AppError(`Invalid URL in ${field}`, 400, "VALIDATION_ERROR");
}
