"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPOSED_ANIMATION_TOKENS = exports.COMPOSED_DESIGN_STYLES = exports.COMPOSED_SECTION_TYPE_HINTS = exports.COMPOSED_ELEMENT_TYPES = void 0;
exports.componentCatalogForPrompt = componentCatalogForPrompt;
/** Component catalog sent to the model (keep compact for token limits). */
exports.COMPOSED_ELEMENT_TYPES = [
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
];
exports.COMPOSED_SECTION_TYPE_HINTS = [
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
];
exports.COMPOSED_DESIGN_STYLES = [
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
];
exports.COMPOSED_ANIMATION_TOKENS = [
    "fade-in",
    "slide-up",
    "subtle-hover-lift",
    "none",
];
function componentCatalogForPrompt() {
    return exports.COMPOSED_ELEMENT_TYPES.map((t) => `- ${t}`).join("\n");
}
