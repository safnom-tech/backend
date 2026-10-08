/**
 * Server-side catalog of importable AI design sections.
 * Keep ids in sync with frontend lib/aiDesignSections.ts
 */
export const AI_DESIGN_SECTION_IDS = [
  "image-accordion",
  "industry-carousel",
] as const;

export type AiDesignSectionId = (typeof AI_DESIGN_SECTION_IDS)[number];

export const AI_DESIGN_SECTION_CATALOG: {
  id: AiDesignSectionId;
  name: string;
}[] = [
  { id: "image-accordion", name: "Image + accordion" },
  { id: "industry-carousel", name: "Industry carousel" },
];
