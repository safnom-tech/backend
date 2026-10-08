import { env } from "../../../config/env.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { parseJsonFromModelText } from "../utils/ai-response-parser.js";
import type { AICompletionInput, AIProvider } from "./ai.provider.types.js";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  async completeJson(input: AICompletionInput): Promise<unknown> {
    if (!env.aiApiKey) {
      throw new AppError("AI is not configured", 503, "AI_NOT_CONFIGURED");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.aiTimeoutMs);

    try {
      const res = await fetch(`${env.aiBaseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.aiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env.aiModel,
          temperature: 0.4,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: input.systemPrompt },
            { role: "user", content: input.userPrompt },
          ],
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        throw new AppError(
          "AI service is temporarily busy. Please try again.",
          503,
          "AI_RATE_LIMITED"
        );
      }
      if (!res.ok) {
        throw new AppError("AI provider request failed", 502, "AI_PROVIDER_ERROR");
      }

      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = body.choices?.[0]?.message?.content ?? "";
      return parseJsonFromModelText(text);
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new AppError("AI request timed out", 504, "AI_TIMEOUT");
      }
      throw new AppError("AI provider request failed", 502, "AI_PROVIDER_ERROR");
    } finally {
      clearTimeout(timer);
    }
  }
}
