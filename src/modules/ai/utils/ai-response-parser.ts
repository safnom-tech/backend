import { AppError } from "../../../middleware/error.middleware.js";

const MAX_JSON_CHARS = 200_000;

export function parseJsonFromModelText(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.length > MAX_JSON_CHARS) {
    throw new AppError("AI response too large", 400, "AI_INVALID_RESPONSE");
  }

  let candidate = trimmed;
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(trimmed);
  if (fence) {
    candidate = fence[1].trim();
  }

  try {
    return JSON.parse(candidate);
  } catch {
    throw new AppError("AI returned invalid JSON", 400, "AI_INVALID_RESPONSE");
  }
}
