import type {
  ComposedNodeOutput,
  ComposedSectionDefinition,
} from "./composed-section.schema.js";
import { applyDefaultComposedImages } from "./composed-default-image.js";

export const COMPOSED_LAYOUT_PRESET_IDS = [
  "image-accordion",
  "industry-carousel",
] as const;

export type ComposedLayoutPresetId = (typeof COMPOSED_LAYOUT_PRESET_IDS)[number];

const EMPTY_SECTION_CONTENT = { eyebrow: "", title: "", description: "" };

export type PresetCopy = {
  titleLine1: string;
  titleLine2: string;
  description: string;
  accordionItems: { title: string; body: string }[];
  carouselTitle: string;
  carouselSlides: { title: string; icon: string }[];
};

export function copyFromPrompt(prompt: string): PresetCopy {
  const lower = prompt.toLowerCase();
  const logistics =
    lower.includes("logistic") ||
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

function featureImage(): ComposedNodeOutput {
  return {
    type: "image",
    props: {
      alt: "Section photo",
      aspectRatio: "portrait",
    },
  };
}

const PRESET_BUILDERS: Record<
  ComposedLayoutPresetId,
  (copy: PresetCopy) => ComposedSectionDefinition
> = {
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

export function resolveLayoutPresetId(
  explicit: string | undefined,
  prompt: string
): ComposedLayoutPresetId {
  if (
    explicit &&
    COMPOSED_LAYOUT_PRESET_IDS.includes(explicit as ComposedLayoutPresetId)
  ) {
    return explicit as ComposedLayoutPresetId;
  }
  const lower = prompt.toLowerCase();
  if (
    lower.includes("carousel") ||
    lower.includes("slider") ||
    lower.includes("industr")
  ) {
    return "industry-carousel";
  }
  if (
    lower.includes("accordion") ||
    lower.includes("faq") ||
    lower.includes("steps")
  ) {
    return "image-accordion";
  }
  return "image-accordion";
}

export function buildMockComposedSectionFromPreset(
  presetId: ComposedLayoutPresetId,
  prompt: string
): ComposedSectionDefinition {
  const copy = copyFromPrompt(prompt);
  const build =
    PRESET_BUILDERS[presetId] ?? PRESET_BUILDERS["image-accordion"];
  return applyDefaultComposedImages(build(copy));
}

export function buildMockComposedSection(
  prompt: string
): ComposedSectionDefinition {
  const id = resolveLayoutPresetId(undefined, prompt);
  return buildMockComposedSectionFromPreset(id, prompt);
}

export function presetStructureSummary(id: ComposedLayoutPresetId): string {
  const summaries: Record<ComposedLayoutPresetId, string> = {
    "image-accordion":
      "Two columns: large portrait image left; dual-line headline, intro paragraph, and numbered accordion (4 items) right. Text only from AI; images use stock placeholder.",
    "industry-carousel":
      "Carousel root with title prop, nav arrows, and 4 portrait industry cards (slide title + icon + imageUrl slot). Text only from AI; all card photos use the same stock placeholder.",
  };
  return summaries[id];
}
