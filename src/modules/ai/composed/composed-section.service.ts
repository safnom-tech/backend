import { AppError } from "../../../middleware/error.middleware.js";
import { assertPageInWebsite } from "../../pages/pages.service.js";
import { getWebsite } from "../../websites/websites.service.js";
import { validateSectionData } from "../ai.validation.js";
import type { BusinessContextInput } from "../ai.types.js";
import { getAIProvider } from "../providers/index.js";
import { parseJsonFromModelText } from "../utils/ai-response-parser.js";
import {
  buildDesignSystemContext,
  buildWebsiteSummary,
  summarizePageSections,
} from "./composed-section.context.js";
import {
  composedSectionSystemPrompt,
  composedSectionUserPrompt,
} from "./composed-section.prompts.js";
import {
  aiComposedSectionResponseSchema,
  composedSectionToPageData,
  normalizeComposedSection,
  type ComposedSectionDefinition,
} from "./composed-section.schema.js";
import { applyPresetDesignWithAiContent } from "./composed-preset-content-merge.js";

export type ComposedSectionRequest = {
  websiteId: string;
  pageId: string;
  prompt: string;
  sectionTypeHint?: string;
  designStyle?: string;
  additionalRequirements?: string[];
  layoutPresetId?: string;
  businessContext?: BusinessContextInput;
  currentSection?: ComposedSectionDefinition | null;
};

async function completeJsonOnce(systemPrompt: string, userPrompt: string) {
  const provider = getAIProvider();
  const raw = await provider.completeJson({ systemPrompt, userPrompt });
  if (typeof raw === "string") {
    return parseJsonFromModelText(raw);
  }
  return raw;
}

async function completeJsonWithRetry(systemPrompt: string, userPrompt: string) {
  try {
    return await completeJsonOnce(systemPrompt, userPrompt);
  } catch (err) {
    const retryable =
      err instanceof AppError && err.code === "AI_PROVIDER_ERROR";
    if (!retryable) throw err;
    return await completeJsonOnce(systemPrompt, userPrompt);
  }
}

export async function runComposedSectionGeneration(
  workspaceId: string,
  input: ComposedSectionRequest,
  mode: "generate" | "regenerate" | "edit"
): Promise<{
  section: ComposedSectionDefinition;
  type: "COMPOSED";
  data: Record<string, unknown>;
  settings: Record<string, unknown>;
}> {
  const prompt = input.prompt?.trim();
  if (!prompt) {
    throw new AppError("prompt is required", 400, "VALIDATION_ERROR");
  }

  const page = await assertPageInWebsite(
    workspaceId,
    input.websiteId,
    input.pageId
  );
  const website = await getWebsite(workspaceId, input.websiteId);

  const currentSection = input.currentSection
    ? normalizeComposedSection(input.currentSection)
    : null;

  if ((mode === "regenerate" || mode === "edit") && !currentSection) {
    throw new AppError(
      "currentSection is required for this action",
      400,
      "VALIDATION_ERROR"
    );
  }

  const userPrompt = composedSectionUserPrompt({
    mode,
    prompt,
    sectionTypeHint: input.sectionTypeHint,
    designStyle: input.designStyle,
    additionalRequirements: input.additionalRequirements,
    layoutPresetId: input.layoutPresetId,
    pageName: page.name,
    pageSlug: page.slug,
    websiteSummary: buildWebsiteSummary(website, input.businessContext),
    designSystem: buildDesignSystemContext(website),
    pageStructureSummary: summarizePageSections(page),
    currentSection,
  });

  let parsed: unknown;
  try {
    parsed = await completeJsonWithRetry(
      composedSectionSystemPrompt(mode),
      userPrompt
    );
  } catch (err) {
    if (err instanceof AppError) {
      if (err.code === "AI_TIMEOUT") {
        throw new AppError(
          "We couldn't generate the section right now. Please try again.",
          504,
          "AI_TIMEOUT"
        );
      }
      if (err.code === "AI_PROVIDER_ERROR" || err.code === "AI_INVALID_JSON") {
        throw new AppError(
          "We couldn't generate the section right now. Please try again.",
          502,
          "AI_GENERATION_FAILED"
        );
      }
    }
    throw err;
  }

  let section: ComposedSectionDefinition;
  try {
    const result = aiComposedSectionResponseSchema.parse(parsed);
    let parsedSection = normalizeComposedSection(result.section);
    if (mode === "generate" && input.layoutPresetId) {
      parsedSection = normalizeComposedSection(
        applyPresetDesignWithAiContent(
          input.layoutPresetId,
          prompt,
          parsedSection
        )
      );
    }
    section = parsedSection;
  } catch {
    throw new AppError(
      "We couldn't generate the section right now. Please try again.",
      502,
      "AI_GENERATION_FAILED"
    );
  }

  const data = validateSectionData("COMPOSED", composedSectionToPageData(section));

  return {
    section: (data.section as ComposedSectionDefinition) ?? section,
    type: "COMPOSED",
    data,
    settings: { aiGenerated: true, semanticType: section.semanticType },
  };
}

export async function generateComposedSection(
  workspaceId: string,
  input: ComposedSectionRequest
) {
  return runComposedSectionGeneration(workspaceId, input, "generate");
}

export async function regenerateComposedSection(
  workspaceId: string,
  input: ComposedSectionRequest
) {
  return runComposedSectionGeneration(workspaceId, input, "regenerate");
}

export async function editComposedSection(
  workspaceId: string,
  input: ComposedSectionRequest
) {
  return runComposedSectionGeneration(workspaceId, input, "edit");
}
