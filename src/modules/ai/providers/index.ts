import { env } from "../../../config/env.js";
import { AppError } from "../../../middleware/error.middleware.js";
import type { AIProvider } from "./ai.provider.types.js";
import { MockAIProvider } from "./mock.provider.js";
import { OpenAIProvider } from "./openai.provider.js";

let overrideProvider: AIProvider | null = null;

export function setAIProviderForTests(provider: AIProvider | null): void {
  overrideProvider = provider;
}

export function getAIProvider(): AIProvider {
  if (overrideProvider) return overrideProvider;
  if (env.aiProvider === "mock") {
    return new MockAIProvider();
  }
  if (env.aiProvider === "openai") {
    return new OpenAIProvider();
  }
  throw new AppError("AI is not configured", 503, "AI_NOT_CONFIGURED");
}

export type { AIProvider } from "./ai.provider.types.js";
export { setMockAiBehavior, getMockAiBehavior } from "./mock.provider.js";
