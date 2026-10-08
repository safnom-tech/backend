import { z } from "zod";
import { AppError } from "../../../middleware/error.middleware.js";
import { sanitizePlainText } from "../ai.sanitize.js";
import { getAIProvider } from "../providers/index.js";
import { parseJsonFromModelText } from "../utils/ai-response-parser.js";
import {
  enforceFieldContentLimit,
  isProseFieldType,
  resolveFieldLimits,
  resolveLengthBoundsFromCurrent,
  type FieldContentType,
} from "./field-content.limits.js";
import {
  fieldContentSystemPrompt,
  fieldContentUserPrompt,
} from "./field-content.prompts.js";
import { formatLongFieldContent } from "./field-content.prose.js";

const resultSchema = z.object({
  content: z.string(),
});

export type GenerateFieldContentInput = {
  prompt: string;
  fieldType: FieldContentType;
  maxChars?: number;
  maxWords?: number;
  currentValue?: string;
  regenerate?: boolean;
  businessContext?: {
    businessName?: string;
    businessType?: string;
    businessDescription?: string;
  };
};

async function completeJsonOnce(systemPrompt: string, userPrompt: string) {
  const provider = getAIProvider();
  const raw = await provider.completeJson({ systemPrompt, userPrompt });
  if (typeof raw === "string") {
    return parseJsonFromModelText(raw);
  }
  return raw;
}

export async function generateFieldContent(
  input: GenerateFieldContentInput
): Promise<{ content: string }> {
  const prompt = input.prompt?.trim();
  if (!prompt) {
    throw new AppError("prompt is required", 400, "VALIDATION_ERROR");
  }

  const limits = resolveFieldLimits(
    input.fieldType,
    input.maxChars,
    input.maxWords
  );
  const bounds = resolveLengthBoundsFromCurrent(
    input.fieldType,
    input.currentValue,
    limits
  );
  const effectiveLimits = {
    maxChars: bounds.maxChars,
    maxWords: bounds.maxWords,
  };

  let parsed: unknown;
  try {
    parsed = await completeJsonOnce(
      fieldContentSystemPrompt(),
      fieldContentUserPrompt({
        fieldType: input.fieldType,
        prompt,
        maxChars: effectiveLimits.maxChars,
        minChars: bounds.minChars,
        maxWords: effectiveLimits.maxWords,
        minWords: bounds.minWords,
        currentValue: input.currentValue,
        mode: input.regenerate ? "regenerate" : "generate",
        businessContext: input.businessContext,
      })
    );
  } catch (err) {
    if (err instanceof AppError && err.code === "AI_TIMEOUT") {
      throw new AppError(
        "We couldn't generate content right now. Please try again.",
        504,
        "AI_TIMEOUT"
      );
    }
    throw new AppError(
      "We couldn't generate content right now. Please try again.",
      502,
      "AI_GENERATION_FAILED"
    );
  }

  let rawContent: string;
  try {
    rawContent = resultSchema.parse(parsed).content;
  } catch {
    throw new AppError(
      "We couldn't generate content right now. Please try again.",
      502,
      "AI_GENERATION_FAILED"
    );
  }

  const completeSentences = isProseFieldType(input.fieldType);
  const limitOpts = { completeSentences };
  const limited = enforceFieldContentLimit(rawContent, effectiveLimits, limitOpts);
  const formatted = formatLongFieldContent(limited, input.fieldType);
  const trimmed = enforceFieldContentLimit(formatted, effectiveLimits, limitOpts);
  const safe = sanitizePlainText(trimmed, effectiveLimits.maxChars, "content", limitOpts);

  return { content: safe };
}
