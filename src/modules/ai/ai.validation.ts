import { z } from "zod";
import { SECTION_TYPES } from "../pages/pages.constants.js";
import { PAGE_TYPES } from "../pages/pages.model.js";
import { composedSectionDefinitionSchema } from "./composed/composed-section.schema.js";
import { sanitizePlainText, sanitizeUrlField } from "./ai.sanitize.js";

const safeStr = (max: number) =>
  z.string().transform((v) => sanitizePlainText(v, max));

const faqItem = z.object({
  q: safeStr(300),
  a: safeStr(2000),
});

export const sectionDataSchemas: Record<
  (typeof SECTION_TYPES)[number],
  z.ZodType<Record<string, unknown>>
> = {
  HEADER: z
    .object({
      logoText: safeStr(120),
      navLabel: safeStr(80).optional(),
    })
    .strip(),
  HERO: z
    .object({
      title: safeStr(200),
      description: safeStr(2000).optional(),
      buttonText: safeStr(80).optional(),
      buttonUrl: z.string().transform((v) => sanitizeUrlField(v, "buttonUrl")).optional(),
      secondaryButtonText: safeStr(80).optional(),
      secondaryButtonUrl: z
        .string()
        .transform((v) => sanitizeUrlField(v, "secondaryButtonUrl"))
        .optional(),
      imageUrl: z.string().max(2048).optional(),
      imageAlt: safeStr(300).optional(),
    })
    .strip(),
  TEXT: z
    .object({
      heading: safeStr(200),
      body: safeStr(8000).optional(),
    })
    .strip(),
  IMAGE: z
    .object({
      url: z.string().max(2048).optional(),
      alt: safeStr(300).optional(),
    })
    .strip(),
  SERVICES: z
    .object({
      heading: safeStr(200),
      items: z.array(safeStr(200)).max(30),
    })
    .strip(),
  FEATURES: z
    .object({
      heading: safeStr(200),
      items: z.array(safeStr(200)).max(30),
    })
    .strip(),
  GALLERY: z
    .object({
      heading: safeStr(200).optional(),
      images: z
        .array(
          z.object({
            url: z.string().max(2048),
            alt: safeStr(300).optional(),
          })
        )
        .max(24)
        .optional(),
    })
    .strip(),
  TESTIMONIALS: z
    .object({
      heading: safeStr(200).optional(),
      quote: safeStr(2000),
      author: safeStr(120).optional(),
    })
    .strip(),
  PRICING: z
    .object({
      heading: safeStr(200).optional(),
      planName: safeStr(120),
      price: safeStr(80),
      features: z.array(safeStr(200)).max(30).optional(),
    })
    .strip(),
  FAQ: z
    .object({
      heading: safeStr(200).optional(),
      items: z.array(faqItem).max(20),
    })
    .strip(),
  CONTACT: z
    .object({
      heading: safeStr(200).optional(),
      email: safeStr(200).optional(),
      buttonText: safeStr(80).optional(),
    })
    .strip(),
  FOOTER: z
    .object({
      copyright: safeStr(200).optional(),
      links: safeStr(500).optional(),
    })
    .strip(),
  COMPOSED: z
    .object({
      schemaVersion: z.literal(1),
      section: composedSectionDefinitionSchema,
    })
    .strip(),
};

export function validateSectionData(
  type: (typeof SECTION_TYPES)[number],
  data: unknown
): Record<string, unknown> {
  const schema = sectionDataSchemas[type];
  return schema.parse(data ?? {}) as Record<string, unknown>;
}

const themeSchema = z.object({
  colors: z.record(z.string(), z.string().max(64)).optional(),
  typography: z.record(z.string(), z.string().max(120)).optional(),
  buttons: z.record(z.string(), z.string().max(64)).optional(),
});

const seoOutSchema = z.object({
  title: safeStr(120).nullable().optional(),
  metaDescription: safeStr(320).nullable().optional(),
});

export const aiWebsiteDraftSchema = z.object({
  website: z.object({
    name: safeStr(120),
    description: safeStr(500).optional(),
  }),
  theme: themeSchema,
  pages: z
    .array(
      z.object({
        name: safeStr(120),
        slug: safeStr(80),
        pageType: z.enum(PAGE_TYPES).optional(),
        seo: seoOutSchema.optional(),
        sections: z
          .array(
            z.object({
              type: z.enum(SECTION_TYPES),
              order: z.number().int().min(0),
              data: z.record(z.string(), z.unknown()).default({}),
              settings: z.record(z.string(), z.unknown()).optional(),
            })
          )
          .min(1)
          .max(20),
      })
    )
    .min(1)
    .max(10),
});

export const aiSectionResultSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const aiCreateSectionResultSchema = z.object({
  type: z.enum(SECTION_TYPES),
  data: z.record(z.string(), z.unknown()),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const aiSeoResultSchema = z.object({
  seo: seoOutSchema,
});

export function normalizeWebsiteDraft(raw: z.infer<typeof aiWebsiteDraftSchema>) {
  return {
    ...raw,
    pages: raw.pages.map((p) => ({
      ...p,
      pageType: p.pageType ?? "HOME",
      sections: p.sections.map((s) => ({
        ...s,
        data: validateSectionData(s.type, s.data),
        settings: s.settings ?? {},
      })),
    })),
  };
}
