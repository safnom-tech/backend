import { logger } from "../../utils/logger.js";
import { AppError } from "../../middleware/error.middleware.js";
import { assertPageInWebsite } from "../pages/pages.service.js";
import { listPagesForWebsite } from "../pages/pages.service.js";
import { seedWebsiteContent } from "../pages/pages.seed.js";
import { createWebsite, deleteWebsite } from "../websites/websites.service.js";
import {
  aiSeoResultSchema,
  aiSectionResultSchema,
  aiWebsiteDraftSchema,
  normalizeWebsiteDraft,
  validateSectionData,
} from "./ai.validation.js";
import { generateComposedSection } from "./composed/composed-section.service.js";
import {
  sectionActionSystemPrompt,
  sectionActionUserPrompt,
  seoActionSystemPrompt,
  seoActionUserPrompt,
  websiteDraftSystemPrompt,
  websiteDraftUserPrompt,
} from "./ai.prompts.js";
import { getAIProvider } from "./providers/index.js";
import { parseJsonFromModelText } from "./utils/ai-response-parser.js";
import type {
  AiSectionAction,
  GenerateWebsiteInput,
  GenerateWebsiteResult,
  SectionActionInput,
} from "./ai.types.js";
import type { SECTION_TYPES } from "../pages/pages.constants.js";

function effectiveSectionType(
  action: AiSectionAction,
  sectionType?: string
): (typeof SECTION_TYPES)[number] {
  if (action === "generate_about") return "TEXT";
  if (action === "generate_services") return "SERVICES";
  if (action === "generate_faqs") return "FAQ";
  if (!sectionType) {
    throw new AppError("sectionType is required", 400, "VALIDATION_ERROR");
  }
  return sectionType as (typeof SECTION_TYPES)[number];
}

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
      err instanceof AppError &&
      err.code === "AI_PROVIDER_ERROR";
    if (!retryable) throw err;
    return await completeJsonOnce(systemPrompt, userPrompt);
  }
}

function logAiOp(meta: Record<string, unknown>, success: boolean, started: number) {
  logger.info({
    ...meta,
    success,
    durationMs: Date.now() - started,
  }, "ai_operation");
}

export async function generateWebsiteFromAi(
  workspaceId: string,
  input: GenerateWebsiteInput
): Promise<GenerateWebsiteResult> {
  const started = Date.now();
  const meta = { action: "website_generate", workspaceId, provider: getAIProvider().name };
  try {
    const parsed = await completeJsonWithRetry(
      websiteDraftSystemPrompt(),
      websiteDraftUserPrompt(input)
    );
    const draft = normalizeWebsiteDraft(aiWebsiteDraftSchema.parse(parsed));

    const website = await createWebsite(workspaceId, {
      name: draft.website.name,
      description: draft.website.description ?? undefined,
    });

    try {
      await seedWebsiteContent(workspaceId, website.id, {
        theme: draft.theme,
        pages: draft.pages,
      });
    } catch (seedErr) {
      try {
        await deleteWebsite(workspaceId, website.id);
      } catch {
        /* best effort */
      }
      throw seedErr;
    }

    const pages = await listPagesForWebsite(workspaceId, website.id);
    logAiOp(meta, true, started);
    return { website, pages };
  } catch (err) {
    logAiOp(meta, false, started);
    throw err;
  }
}

export async function runSectionAction(
  workspaceId: string,
  input: SectionActionInput
): Promise<{
  type?: (typeof SECTION_TYPES)[number];
  data?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  seo?: { title?: string | null; metaDescription?: string | null };
}> {
  const started = Date.now();
  const meta = {
    action: input.action,
    workspaceId,
    websiteId: input.websiteId,
    pageId: input.pageId,
    sectionId: input.sectionId,
    provider: getAIProvider().name,
  };

  try {
    const page = await assertPageInWebsite(
      workspaceId,
      input.websiteId,
      input.pageId
    );

    if (input.action === "create_from_prompt") {
      const composed = await generateComposedSection(workspaceId, {
        websiteId: input.websiteId,
        pageId: input.pageId,
        prompt: input.prompt ?? "",
        businessContext: input.businessContext,
      });
      logAiOp(meta, true, started);
      return {
        type: composed.type,
        data: composed.data,
        settings: composed.settings,
      };
    }

    if (input.action === "seo_title" || input.action === "seo_description") {
      const parsed = await completeJsonWithRetry(
        seoActionSystemPrompt(input.action),
        seoActionUserPrompt({
          action: input.action,
          pageName: page.name,
          businessContext: input.businessContext,
          currentSeo: page.seo,
        })
      );
      const result = aiSeoResultSchema.parse(parsed);
      logAiOp(meta, true, started);
      return { seo: result.seo };
    }

    const type = effectiveSectionType(input.action, input.sectionType);
    if (input.sectionId) {
      const section = page.sections.find((s) => s.id === input.sectionId);
      if (!section) {
        throw new AppError("Section not found", 404, "SECTION_NOT_FOUND");
      }
      if (section.type !== type && input.action !== "generate") {
        throw new AppError("Section type mismatch", 400, "VALIDATION_ERROR");
      }
    }

    let content = input.content;
    let settings = input.settings;
    if (input.sectionId) {
      const section = page.sections.find((s) => s.id === input.sectionId);
      if (section) {
        content = content ?? section.data;
        settings = settings ?? section.settings ?? {};
      }
    }

    const parsed = await completeJsonWithRetry(
      sectionActionSystemPrompt(input.action, type),
      sectionActionUserPrompt({
        action: input.action,
        sectionType: type,
        content,
        settings,
        prompt: input.prompt,
        businessContext: input.businessContext,
      })
    );

    const result = aiSectionResultSchema.parse(parsed);
    const data = validateSectionData(type, result.data);
    logAiOp(meta, true, started);
    return { data, settings: result.settings ?? {} };
  } catch (err) {
    logAiOp(meta, false, started);
    throw err;
  }
}
