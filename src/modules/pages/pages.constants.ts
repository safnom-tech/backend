export const SECTION_TYPES = [
  "HEADER",
  "HERO",
  "TEXT",
  "IMAGE",
  "SERVICES",
  "FEATURES",
  "GALLERY",
  "TESTIMONIALS",
  "PRICING",
  "FAQ",
  "CONTACT",
  "FOOTER",
  "COMPOSED",
] as const;

export type SectionTypeConstant = (typeof SECTION_TYPES)[number];
