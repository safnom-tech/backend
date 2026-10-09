"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiComposedSectionResponseSchema = exports.composedSectionDefinitionSchema = exports.composedNodeSchema = exports.composedSectionThemeSchema = void 0;
exports.normalizeComposedSection = normalizeComposedSection;
exports.composedSectionToPageData = composedSectionToPageData;
const zod_1 = require("zod");
const ai_sanitize_js_1 = require("../ai.sanitize.js");
const composed_default_image_js_1 = require("./composed-default-image.js");
const composed_section_catalog_js_1 = require("./composed-section.catalog.js");
const safeStr = (max) => zod_1.z.string().transform((v) => (0, ai_sanitize_js_1.sanitizePlainText)(v, max));
const MAX_NODES = 80;
const MAX_DEPTH = 10;
const responsiveColumnsSchema = zod_1.z
    .object({
    desktop: zod_1.z.number().int().min(1).max(6).optional(),
    tablet: zod_1.z.number().int().min(1).max(6).optional(),
    mobile: zod_1.z.number().int().min(1).max(6).optional(),
})
    .optional();
const imageIntentSchema = zod_1.z
    .object({
    role: safeStr(80).optional(),
    description: safeStr(500).optional(),
})
    .optional();
const statsItemSchema = zod_1.z.object({
    value: safeStr(40),
    label: safeStr(120),
});
const faqItemSchema = zod_1.z.object({
    title: safeStr(200),
    body: safeStr(2000),
});
const galleryItemSchema = zod_1.z.object({
    url: zod_1.z.string().max(2048).optional(),
    alt: safeStr(300).optional(),
    intent: imageIntentSchema,
});
const socialLinkSchema = zod_1.z.object({
    platform: safeStr(40),
    url: zod_1.z.string().transform((v) => (0, ai_sanitize_js_1.sanitizeUrlField)(v, "socialUrl")),
});
exports.composedSectionThemeSchema = zod_1.z
    .object({
    style: safeStr(64).optional(),
    spacing: zod_1.z.enum(["compact", "medium", "large"]).optional(),
    borderRadius: zod_1.z.enum(["none", "small", "medium", "large"]).optional(),
    background: zod_1.z
        .enum(["default", "muted", "primary", "gradient", "dark"])
        .optional(),
})
    .strip();
exports.composedNodeSchema = zod_1.z.lazy(() => zod_1.z
    .object({
    type: zod_1.z.enum(composed_section_catalog_js_1.COMPOSED_ELEMENT_TYPES),
    props: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    children: zod_1.z.array(exports.composedNodeSchema).max(24).optional(),
})
    .strip());
exports.composedSectionDefinitionSchema = zod_1.z
    .object({
    semanticType: safeStr(64),
    layout: safeStr(120),
    theme: exports.composedSectionThemeSchema.optional(),
    content: zod_1.z
        .object({
        eyebrow: safeStr(120).optional(),
        title: safeStr(240).optional(),
        description: safeStr(4000).optional(),
    })
        .strip()
        .optional(),
    root: exports.composedNodeSchema,
    responsive: zod_1.z
        .object({
        desktop: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
        tablet: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
        mobile: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    })
        .strip()
        .optional(),
    animations: zod_1.z.array(zod_1.z.enum(composed_section_catalog_js_1.COMPOSED_ANIMATION_TOKENS)).max(8).optional(),
})
    .strip();
exports.aiComposedSectionResponseSchema = zod_1.z.object({
    section: exports.composedSectionDefinitionSchema,
});
function sanitizeNodeProps(type, props) {
    if (!props)
        return undefined;
    const out = {};
    const copyStr = (key, max) => {
        const v = props[key];
        if (typeof v === "string" && v.trim()) {
            out[key] = (0, ai_sanitize_js_1.sanitizePlainText)(v, max, key);
        }
    };
    switch (type) {
        case "heading":
            copyStr("text", 240);
            if (typeof props.level === "number") {
                out.level = Math.min(3, Math.max(1, Math.floor(props.level)));
            }
            if (props.align === "left" || props.align === "center" || props.align === "right") {
                out.align = props.align;
            }
            if (props.size === "sm" || props.size === "md" || props.size === "lg" || props.size === "xl") {
                out.size = props.size;
            }
            if (props.muted === true)
                out.muted = true;
            break;
        case "text":
            copyStr("text", 8000);
            if (props.size === "sm" || props.size === "md" || props.size === "lg") {
                out.size = props.size;
            }
            if (props.muted === true)
                out.muted = true;
            break;
        case "button":
            copyStr("label", 80);
            if (typeof props.href === "string") {
                out.href = (0, ai_sanitize_js_1.sanitizeUrlField)(props.href, "href");
            }
            if (props.variant === "primary" || props.variant === "secondary" || props.variant === "ghost") {
                out.variant = props.variant;
            }
            if (props.action === "contact")
                out.action = "contact";
            break;
        case "image":
        case "avatar":
            copyStr("alt", 300);
            if (typeof props.url === "string" && props.url.trim()) {
                out.url = props.url.trim().slice(0, 2048);
            }
            if (props.aspectRatio === "square" || props.aspectRatio === "video" || props.aspectRatio === "portrait") {
                out.aspectRatio = props.aspectRatio;
            }
            if (props.intent && typeof props.intent === "object") {
                const parsed = imageIntentSchema.safeParse(props.intent);
                if (parsed.success)
                    out.intent = parsed.data;
            }
            break;
        case "badge":
            copyStr("text", 80);
            break;
        case "stats":
            if (Array.isArray(props.items)) {
                out.items = props.items
                    .slice(0, 12)
                    .map((item) => statsItemSchema.parse(item));
            }
            break;
        case "gallery":
            if (Array.isArray(props.images)) {
                out.images = props.images
                    .slice(0, 16)
                    .map((item) => galleryItemSchema.parse(item));
            }
            break;
        case "accordion":
        case "tabs":
            if (Array.isArray(props.items)) {
                out.items = props.items.slice(0, 12).map((item) => faqItemSchema.parse(item));
            }
            if (props.numbered === true)
                out.numbered = true;
            break;
        case "carousel":
            copyStr("title", 240);
            if (props.variant === "industry-cards")
                out.variant = "industry-cards";
            if (props.showNav === true)
                out.showNav = true;
            if (Array.isArray(props.slides)) {
                out.slides = props.slides.slice(0, 12).map((slide) => {
                    if (typeof slide === "object" && slide !== null) {
                        const s = slide;
                        const imageUrl = typeof s.imageUrl === "string" ? s.imageUrl.trim().slice(0, 2048) : "";
                        const icon = typeof s.icon === "string"
                            ? (0, ai_sanitize_js_1.sanitizePlainText)(s.icon, 8, "icon")
                            : undefined;
                        return {
                            title: (0, ai_sanitize_js_1.sanitizePlainText)(String(s.title ?? ""), 200, "title"),
                            body: (0, ai_sanitize_js_1.sanitizePlainText)(String(s.body ?? ""), 2000, "body"),
                            ...(imageUrl ? { imageUrl } : {}),
                            ...(icon ? { icon } : {}),
                        };
                    }
                    return { title: "", body: (0, ai_sanitize_js_1.sanitizePlainText)(String(slide), 2000) };
                });
            }
            break;
        case "socialLinks":
            if (Array.isArray(props.links)) {
                out.links = props.links
                    .slice(0, 8)
                    .map((link) => socialLinkSchema.parse(link));
            }
            break;
        case "grid":
            if (props.columns && typeof props.columns === "object") {
                const parsed = responsiveColumnsSchema.safeParse(props.columns);
                if (parsed.success)
                    out.columns = parsed.data;
            }
            if (props.gap === "sm" || props.gap === "md" || props.gap === "lg") {
                out.gap = props.gap;
            }
            break;
        case "flex":
            if (props.direction === "row" || props.direction === "col") {
                out.direction = props.direction;
            }
            if (props.gap === "sm" || props.gap === "md" || props.gap === "lg") {
                out.gap = props.gap;
            }
            if (props.align === "start" || props.align === "center" || props.align === "end") {
                out.align = props.align;
            }
            if (props.justify === "start" || props.justify === "center" || props.justify === "between") {
                out.justify = props.justify;
            }
            break;
        case "container":
            if (props.maxWidth === "sm" || props.maxWidth === "md" || props.maxWidth === "lg" || props.maxWidth === "full") {
                out.maxWidth = props.maxWidth;
            }
            if (props.align === "left" || props.align === "center") {
                out.align = props.align;
            }
            break;
        case "card":
            if (props.elevated === true)
                out.elevated = true;
            break;
        case "divider":
            if (props.spacing === "sm" || props.spacing === "md" || props.spacing === "lg") {
                out.spacing = props.spacing;
            }
            break;
        case "spacer":
            if (typeof props.size === "number") {
                out.size = Math.min(96, Math.max(4, Math.floor(props.size)));
            }
            break;
        case "icon":
            copyStr("name", 40);
            break;
        case "video":
            if (typeof props.url === "string" && props.url.trim()) {
                out.url = (0, ai_sanitize_js_1.sanitizeUrlField)(props.url, "videoUrl");
            }
            copyStr("caption", 240);
            break;
        case "form":
            copyStr("submitLabel", 80);
            break;
        case "input":
            copyStr("label", 120);
            copyStr("placeholder", 160);
            if (props.inputType === "email" || props.inputType === "text" || props.inputType === "tel") {
                out.inputType = props.inputType;
            }
            break;
        default:
            break;
    }
    return Object.keys(out).length ? out : undefined;
}
function normalizeNodeTree(node, depth, counter) {
    if (depth > MAX_DEPTH) {
        return { type: "text", props: { text: "" } };
    }
    counter.count += 1;
    if (counter.count > MAX_NODES) {
        return { type: "text", props: { text: "" } };
    }
    const type = composed_section_catalog_js_1.COMPOSED_ELEMENT_TYPES.includes(node.type) ? node.type : "text";
    const props = sanitizeNodeProps(type, node.props);
    const children = node.children
        ?.slice(0, 24)
        .map((child) => normalizeNodeTree(child, depth + 1, counter));
    return {
        type,
        ...(props ? { props } : {}),
        ...(children?.length ? { children } : {}),
    };
}
function rootHasIntroInTree(node, depth = 0) {
    if (node.type === "badge" || node.type === "heading")
        return true;
    if (depth >= 4)
        return false;
    for (const child of node.children ?? []) {
        if (rootHasIntroInTree(child, depth + 1))
            return true;
    }
    return false;
}
function normalizeComposedSection(section) {
    const parsed = exports.composedSectionDefinitionSchema.parse(section);
    const counter = { count: 0 };
    let root = normalizeNodeTree(parsed.root, 0, counter);
    if (root.type !== "container" && root.type !== "grid" && root.type !== "flex") {
        root = {
            type: "container",
            props: { maxWidth: "lg" },
            children: [root],
        };
    }
    let content = parsed.content;
    if (rootHasIntroInTree(root) && content) {
        content = { eyebrow: "", title: "", description: "" };
    }
    return (0, composed_default_image_js_1.applyDefaultComposedImages)({ ...parsed, root, content });
}
function composedSectionToPageData(section) {
    const normalized = normalizeComposedSection(section);
    return {
        schemaVersion: 1,
        section: normalized,
    };
}
