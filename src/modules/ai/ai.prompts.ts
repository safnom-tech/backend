import type { AiSectionAction, BusinessContextInput, GenerateWebsiteInput } from "./ai.types.js";

const JSON_RULES = `Return ONLY valid JSON. No markdown, no code fences, no HTML, no JavaScript, no explanations. Use supported section types only: HEADER, HERO, TEXT, IMAGE, SERVICES, FEATURES, GALLERY, TESTIMONIALS, PRICING, FAQ, CONTACT, FOOTER. Field names must match Safnom section schemas. HERO data: title, description, buttonText, buttonUrl, optional secondaryButtonText, secondaryButtonUrl, imageUrl (empty string if no image), imageAlt. HERO settings: layout "center"|"split", imagePosition "left"|"right", alignment, paddingY sm|md|lg, imageRadius none|md|lg, fontSize, fontWeight. Never paste the user's prompt verbatim into title or description — write polished visitor-facing copy that matches their intent.`;

export function websiteDraftSystemPrompt(): string {
  return `You are Safnom's website generator. ${JSON_RULES} Output shape: {"website":{"name":"","description":""},"theme":{"colors":{},"typography":{},"buttons":{}},"pages":[{"name":"","slug":"","pageType":"HOME","seo":{"title":"","metaDescription":""},"sections":[{"type":"HERO","order":0,"data":{},"settings":{}}]}]}`;
}

export function websiteDraftUserPrompt(input: GenerateWebsiteInput): string {
  return `Generate a one-page business website draft for:\n${JSON.stringify(input)}`;
}

export function sectionActionSystemPrompt(action: AiSectionAction, sectionType: string): string {
  if (action === "edit_from_prompt") {
    return `You are Safnom's editor assistant. ${JSON_RULES} Section type: ${sectionType} (must stay this type). Follow userInstruction to update copy and layout-related settings (layout, alignment, paddingY, variant, imagePosition, etc.) when requested. Return {"data":{...},"settings":{}} merging improvements into current content; do not drop required fields.`;
  }
  return `You are Safnom's editor assistant. ${JSON_RULES} Action: ${action}. Section type: ${sectionType}. Return {"data":{...},"settings":{}} with data fields for this section type only.`;
}

export function seoActionSystemPrompt(action: "seo_title" | "seo_description"): string {
  return `You are Safnom's SEO assistant. ${JSON_RULES} Return {"seo":{"title":"...","metaDescription":"..."}}. Focus on ${action === "seo_title" ? "title" : "metaDescription"} but include both keys.`;
}

export function sectionActionUserPrompt(params: {
  action: AiSectionAction;
  sectionType: string;
  content?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  prompt?: string;
  businessContext?: BusinessContextInput;
}): string {
  return JSON.stringify({
    action: params.action,
    sectionType: params.sectionType,
    currentContent: params.content ?? {},
    currentSettings: params.settings ?? {},
    userInstruction: params.prompt ?? undefined,
    businessContext: params.businessContext ?? {},
  });
}

export function createSectionSystemPrompt(): string {
  return `You are Safnom's section builder. ${JSON_RULES} Interpret design instructions (layout, style, columns) into settings and marketing copy into data. For banner/hero/SaaS requests prefer type HERO with layout split when an image or two-column layout is requested. Return {"type":"HERO|TEXT|...","data":{...},"settings":{}} with valid fields for that type only.`;
}

export function createSectionUserPrompt(params: {
  prompt: string;
  pageName?: string;
  businessContext?: BusinessContextInput;
}): string {
  return JSON.stringify({
    prompt: params.prompt,
    pageName: params.pageName,
    businessContext: params.businessContext ?? {},
  });
}

export function seoActionUserPrompt(params: {
  action: "seo_title" | "seo_description";
  pageName?: string;
  businessContext?: BusinessContextInput;
  currentSeo?: { title?: string | null; metaDescription?: string | null };
}): string {
  return JSON.stringify(params);
}
