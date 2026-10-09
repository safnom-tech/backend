"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPOSED_LAYOUT_PRESET_IDS = void 0;
exports.copyFromPrompt = copyFromPrompt;
exports.resolveLayoutPresetId = resolveLayoutPresetId;
exports.buildMockComposedSectionFromPreset = buildMockComposedSectionFromPreset;
exports.buildMockComposedSection = buildMockComposedSection;
exports.presetStructureSummary = presetStructureSummary;
const composed_default_image_js_1 = require("./composed-default-image.js");
exports.COMPOSED_LAYOUT_PRESET_IDS = [
    "image-accordion",
    "industry-carousel",
];
const EMPTY_SECTION_CONTENT = { eyebrow: "", title: "", description: "" };
function copyFromPrompt(prompt) {
    const lower = prompt.toLowerCase();
    const logistics = lower.includes("logistic") ||
        lower.includes("freight") ||
        lower.includes("shipping") ||
        lower.includes("delivery");
    const industries = logistics
        ? [
            { title: "Logistics", icon: "🚚" },
            { title: "Delivery", icon: "📦" },
            { title: "Construction", icon: "🏗" },
            { title: "Home Services", icon: "🛠" },
        ]
        : [
            { title: "Retail", icon: "🏪" },
            { title: "Healthcare", icon: "⚕" },
            { title: "Technology", icon: "💻" },
            { title: "Hospitality", icon: "☕" },
        ];
    const topic = prompt.trim().slice(0, 80) || "your business";
    return {
        titleLine1: logistics
            ? "Built for the industries"
            : "Tell your story with clarity.",
        titleLine2: logistics
            ? "that keep the world moving."
            : "Designed around your customers.",
        description: `Copy tailored to: ${topic}. Refine inline after applying.`,
        accordionItems: [
            {
                title: "Step one — understand the need",
                body: "We align on goals, audience, and outcomes before anything goes live.",
            },
            {
                title: "Step two — plan the approach",
                body: "A clear plan keeps delivery fast and measurable.",
            },
            {
                title: "Step three — expert execution",
                body: "Specialists handle the details so you stay focused on growth.",
            },
            {
                title: "Step four — learn and improve",
                body: "Results feed the next cycle so performance keeps climbing.",
            },
        ],
        carouselTitle: logistics
            ? "Built for the industries that keep the world moving."
            : "Trusted across the sectors you serve.",
        carouselSlides: industries,
    };
}
function featureImage() {
    return {
        type: "image",
        props: {
            alt: "Section photo",
            aspectRatio: "portrait",
        },
    };
}
const PRESET_BUILDERS = {
    "image-accordion": (copy) => ({
        semanticType: "about",
        layout: "image-accordion",
        theme: {
            style: "editorial",
            spacing: "large",
            borderRadius: "medium",
            background: "default",
        },
        content: { ...EMPTY_SECTION_CONTENT },
        animations: ["fade-in"],
        root: {
            type: "grid",
            props: { columns: { desktop: 2, tablet: 1, mobile: 1 }, gap: "lg" },
            children: [
                featureImage(),
                {
                    type: "flex",
                    props: { direction: "col", gap: "md", align: "start" },
                    children: [
                        {
                            type: "heading",
                            props: { text: copy.titleLine1, level: 2, size: "xl" },
                        },
                        {
                            type: "heading",
                            props: {
                                text: copy.titleLine2,
                                level: 2,
                                size: "xl",
                                muted: true,
                            },
                        },
                        { type: "text", props: { text: copy.description, size: "md" } },
                        {
                            type: "accordion",
                            props: {
                                numbered: true,
                                items: copy.accordionItems,
                            },
                        },
                    ],
                },
            ],
        },
        responsive: { mobile: { stack: true }, tablet: { stack: true } },
    }),
    "industry-carousel": (copy) => ({
        semanticType: "services",
        layout: "industry-carousel",
        theme: {
            style: "modern",
            spacing: "large",
            borderRadius: "large",
            background: "default",
        },
        content: { ...EMPTY_SECTION_CONTENT },
        animations: ["fade-in"],
        root: {
            type: "carousel",
            props: {
                variant: "industry-cards",
                showNav: true,
                title: copy.carouselTitle,
                slides: copy.carouselSlides.map((s) => ({
                    title: s.title,
                    body: "",
                    icon: s.icon,
                    imageUrl: "",
                })),
            },
        },
        responsive: { mobile: { stack: true } },
    }),
};
function resolveLayoutPresetId(explicit, prompt) {
    if (explicit &&
        exports.COMPOSED_LAYOUT_PRESET_IDS.includes(explicit)) {
        return explicit;
    }
    const lower = prompt.toLowerCase();
    if (lower.includes("carousel") ||
        lower.includes("slider") ||
        lower.includes("industr")) {
        return "industry-carousel";
    }
    if (lower.includes("accordion") ||
        lower.includes("faq") ||
        lower.includes("steps")) {
        return "image-accordion";
    }
    return "image-accordion";
}
function buildMockComposedSectionFromPreset(presetId, prompt) {
    const copy = copyFromPrompt(prompt);
    const build = PRESET_BUILDERS[presetId] ?? PRESET_BUILDERS["image-accordion"];
    return (0, composed_default_image_js_1.applyDefaultComposedImages)(build(copy));
}
function buildMockComposedSection(prompt) {
    const id = resolveLayoutPresetId(undefined, prompt);
    return buildMockComposedSectionFromPreset(id, prompt);
}
function presetStructureSummary(id) {
    const summaries = {
        "image-accordion": "Two columns: large portrait image left; dual-line headline, intro paragraph, and numbered accordion (4 items) right. Text only from AI; images use stock placeholder.",
        "industry-carousel": "Carousel root with title prop, nav arrows, and 4 portrait industry cards (slide title + icon + imageUrl slot). Text only from AI; all card photos use the same stock placeholder.",
    };
    return summaries[id];
}
