import {
  COMPOSED_DESIGN_STYLES,
  COMPOSED_SECTION_TYPE_HINTS,
  componentCatalogForPrompt,
} from "./composed-section.catalog.js";
import {
  buildMockComposedSectionFromPreset,
  presetStructureSummary,
  resolveLayoutPresetId,
  type ComposedLayoutPresetId,
} from "./composed-layout.presets.js";
import type { ComposedSectionDefinition } from "./composed-section.schema.js";

export function composedSectionSystemPrompt(
  mode: "generate" | "regenerate" | "edit" = "generate"
): string {
  const editRules =
    mode === "edit" || mode === "regenerate"
      ? `

EDIT MODE (critical):
- Start from currentSection in the user JSON. Apply userRequest as targeted edits only.
- Preserve structure, images, stats, buttons, and copy the user did NOT ask to change.
- If they ask to remove eyebrow/title/description/badge/heading/text, delete those nodes and clear matching content.* fields.
- Do NOT return the same section unchanged. Do NOT rebuild from scratch unless the user asks for a full redesign.`
      : "";

  return `You are Safnom composed section generator — an expert web designer.
You compose UNIQUE page sections from primitives. You must NOT pick a predefined block template or return legacy section types (HERO, FAQ, etc.).

Return ONLY valid JSON:
{
  "section": {
    "semanticType": "about|hero|custom|...",
    "layout": "short layout id",
    "theme": { "style": "...", "spacing": "compact|medium|large", "borderRadius": "...", "background": "..." },
    "content": { "eyebrow": "", "title": "", "description": "" },
    "root": { "type": "container|grid|flex|...", "props": {}, "children": [] },
    "responsive": { "desktop": {}, "tablet": {}, "mobile": {} },
    "animations": ["fade-in"]
  }
}

Rules:
- Build layouts by nesting supported components. Combine grid/flex/container with heading, text, image, stats, button, gallery, accordion, tabs, carousel, cards, badges, socialLinks.
- Use business-specific copy (no lorem ipsum). Match the website category and tone.
- Follow the provided design system colors and typography unless the user asks for a different style.
- TEXT ONLY: write on-brand copy for headings, text, accordion items, and carousel slide titles. Match userRequest and business context.
- Images: never set props.url or slide imageUrl. Do not describe generating or fetching images. The app injects one shared stock photo for every image slot after generation.
- Optional short alt text on images is fine; omit props.intent to save tokens.
- Buttons: use href "#contact" or valid https URLs; label max 80 chars.
- All intro copy lives in badge/heading/text nodes inside root. Always leave content.eyebrow, content.title, and content.description empty (the app does not render a separate section header).
- Max tree depth ~6; prefer clear hierarchy over deep nesting.
- animations: only fade-in, slide-up, subtle-hover-lift, none.
- semanticType hints: ${COMPOSED_SECTION_TYPE_HINTS.join(", ")}
- design styles: ${COMPOSED_DESIGN_STYLES.join(", ")}

Supported components:
${componentCatalogForPrompt()}

When layoutPresetId is provided (CONTENT-ONLY MODE): the layoutTemplate in the user JSON is the exact design. Return section JSON with the SAME tree shape, node types, and array lengths. ONLY change human-readable strings (text, title, label, accordion item title/body, carousel slide title). Do NOT add/remove/reorder nodes. Do NOT set image urls.
When layoutPresetId and layoutStructureHint are provided, follow that topology unless the user explicitly requests a different structure.
Never include HTML, JavaScript, onclick handlers, or markdown fences.${editRules}`;
}

export type ComposedPromptContext = {
  mode: "generate" | "regenerate" | "edit";
  prompt: string;
  sectionTypeHint?: string;
  designStyle?: string;
  additionalRequirements?: string[];
  layoutPresetId?: string;
  pageName: string;
  pageSlug: string;
  websiteSummary: Record<string, unknown>;
  designSystem: Record<string, unknown>;
  pageStructureSummary: unknown[];
  currentSection?: ComposedSectionDefinition | null;
};

export function composedSectionUserPrompt(ctx: ComposedPromptContext): string {
  const presetId = resolveLayoutPresetId(ctx.layoutPresetId, ctx.prompt);
  const layoutTemplate =
    ctx.mode === "generate" && ctx.layoutPresetId
      ? buildMockComposedSectionFromPreset(
          presetId as ComposedLayoutPresetId,
          "placeholder"
        )
      : null;
  return JSON.stringify({
    mode: ctx.mode,
    userRequest: ctx.prompt,
    sectionTypeHint: ctx.sectionTypeHint ?? null,
    designStyle: ctx.designStyle ?? null,
    additionalRequirements: ctx.additionalRequirements ?? [],
    layoutPresetId: presetId,
    layoutStructureHint: presetStructureSummary(presetId),
    contentOnlyDesign: Boolean(ctx.mode === "generate" && ctx.layoutPresetId),
    layoutTemplate,
    page: { name: ctx.pageName, slug: ctx.pageSlug },
    website: ctx.websiteSummary,
    designSystem: ctx.designSystem,
    existingPageSections: ctx.pageStructureSummary,
    currentSection: ctx.currentSection ?? null,
  });
}
