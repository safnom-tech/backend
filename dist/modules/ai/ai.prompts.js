"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websiteDraftSystemPrompt = websiteDraftSystemPrompt;
exports.websiteDraftUserPrompt = websiteDraftUserPrompt;
exports.sectionActionSystemPrompt = sectionActionSystemPrompt;
exports.seoActionSystemPrompt = seoActionSystemPrompt;
exports.sectionActionUserPrompt = sectionActionUserPrompt;
exports.createSectionSystemPrompt = createSectionSystemPrompt;
exports.createSectionUserPrompt = createSectionUserPrompt;
exports.seoActionUserPrompt = seoActionUserPrompt;
const JSON_RULES = `Return ONLY valid JSON. No markdown, no code fences, no HTML, no JavaScript, no explanations. Use supported section types only: HEADER, HERO, TEXT, IMAGE, SERVICES, FEATURES, GALLERY, TESTIMONIALS, PRICING, FAQ, CONTACT, FOOTER. Field names must match Safnom section schemas. HERO data: title, description, buttonText, buttonUrl, optional secondaryButtonText, secondaryButtonUrl, imageUrl (empty string if no image), imageAlt. HERO settings: layout "center"|"split", imagePosition "left"|"right", alignment, paddingY sm|md|lg, imageRadius none|md|lg, fontSize, fontWeight. Never paste the user's prompt verbatim into title or description — write polished visitor-facing copy that matches their intent.`;
function websiteDraftSystemPrompt() {
    return `You are Safnom's website generator. ${JSON_RULES} Output shape: {"website":{"name":"","description":""},"theme":{"colors":{},"typography":{},"buttons":{}},"pages":[{"name":"","slug":"","pageType":"HOME","seo":{"title":"","metaDescription":""},"sections":[{"type":"HERO","order":0,"data":{},"settings":{}}]}]}`;
}
function websiteDraftUserPrompt(input) {
    return `Generate a one-page business website draft for:\n${JSON.stringify(input)}`;
}
function sectionActionSystemPrompt(action, sectionType) {
    if (action === "edit_from_prompt") {
        return `You are Safnom's editor assistant. ${JSON_RULES} Section type: ${sectionType} (must stay this type). Follow userInstruction to update copy and layout-related settings (layout, alignment, paddingY, variant, imagePosition, etc.) when requested. Return {"data":{...},"settings":{}} merging improvements into current content; do not drop required fields.`;
    }
    return `You are Safnom's editor assistant. ${JSON_RULES} Action: ${action}. Section type: ${sectionType}. Return {"data":{...},"settings":{}} with data fields for this section type only.`;
}
function seoActionSystemPrompt(action) {
    return `You are Safnom's SEO assistant. ${JSON_RULES} Return {"seo":{"title":"...","metaDescription":"..."}}. Focus on ${action === "seo_title" ? "title" : "metaDescription"} but include both keys.`;
}
function sectionActionUserPrompt(params) {
    return JSON.stringify({
        action: params.action,
        sectionType: params.sectionType,
        currentContent: params.content ?? {},
        currentSettings: params.settings ?? {},
        userInstruction: params.prompt ?? undefined,
        businessContext: params.businessContext ?? {},
    });
}
function createSectionSystemPrompt() {
    return `You are Safnom's section builder. ${JSON_RULES} Interpret design instructions (layout, style, columns) into settings and marketing copy into data. For banner/hero/SaaS requests prefer type HERO with layout split when an image or two-column layout is requested. Return {"type":"HERO|TEXT|...","data":{...},"settings":{}} with valid fields for that type only.`;
}
function createSectionUserPrompt(params) {
    return JSON.stringify({
        prompt: params.prompt,
        pageName: params.pageName,
        businessContext: params.businessContext ?? {},
    });
}
function seoActionUserPrompt(params) {
    return JSON.stringify(params);
}
