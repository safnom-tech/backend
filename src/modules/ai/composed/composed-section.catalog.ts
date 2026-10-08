/** Component catalog sent to the model (keep compact for token limits). */
export const COMPOSED_ELEMENT_TYPES = [
  "container",
  "grid",
  "flex",
  "heading",
  "text",
  "image",
  "button",
  "icon",
  "card",
  "badge",
  "avatar",
  "stats",
  "form",
  "input",
  "video",
  "gallery",
  "tabs",
  "accordion",
  "carousel",
  "divider",
  "socialLinks",
  "spacer",
] as const;

export type ComposedElementType = (typeof COMPOSED_ELEMENT_TYPES)[number];

export const COMPOSED_SECTION_TYPE_HINTS = [
  "hero",
  "about",
  "services",
  "features",
  "portfolio",
  "testimonials",
  "pricing",
  "contact",
  "faq",
  "team",
  "custom",
] as const;

export const COMPOSED_DESIGN_STYLES = [
  "modern",
  "minimal",
  "premium",
  "editorial",
  "corporate",
  "creative",
  "luxury",
  "bold",
  "glassmorphism",
  "custom",
] as const;

export const COMPOSED_ANIMATION_TOKENS = [
  "fade-in",
  "slide-up",
  "subtle-hover-lift",
  "none",
] as const;

export function componentCatalogForPrompt(): string {
  return COMPOSED_ELEMENT_TYPES.map((t) => `- ${t}`).join("\n");
}
