"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiSeoResultSchema = exports.aiCreateSectionResultSchema = exports.aiSectionResultSchema = exports.aiWebsiteDraftSchema = exports.sectionDataSchemas = void 0;
exports.validateSectionData = validateSectionData;
exports.normalizeWebsiteDraft = normalizeWebsiteDraft;
const zod_1 = require("zod");
const pages_constants_js_1 = require("../pages/pages.constants.js");
const pages_model_js_1 = require("../pages/pages.model.js");
const composed_section_schema_js_1 = require("./composed/composed-section.schema.js");
const ai_sanitize_js_1 = require("./ai.sanitize.js");
const safeStr = (max) => zod_1.z.string().transform((v) => (0, ai_sanitize_js_1.sanitizePlainText)(v, max));
const faqItem = zod_1.z.object({
    q: safeStr(300),
    a: safeStr(2000),
});
exports.sectionDataSchemas = {
    HEADER: zod_1.z
        .object({
        logoText: safeStr(120),
        navLabel: safeStr(80).optional(),
    })
        .strip(),
    HERO: zod_1.z
        .object({
        title: safeStr(200),
        description: safeStr(2000).optional(),
        buttonText: safeStr(80).optional(),
        buttonUrl: zod_1.z.string().transform((v) => (0, ai_sanitize_js_1.sanitizeUrlField)(v, "buttonUrl")).optional(),
        secondaryButtonText: safeStr(80).optional(),
        secondaryButtonUrl: zod_1.z
            .string()
            .transform((v) => (0, ai_sanitize_js_1.sanitizeUrlField)(v, "secondaryButtonUrl"))
            .optional(),
        imageUrl: zod_1.z.string().max(2048).optional(),
        imageAlt: safeStr(300).optional(),
    })
        .strip(),
    TEXT: zod_1.z
        .object({
        heading: safeStr(200),
        body: safeStr(8000).optional(),
    })
        .strip(),
    IMAGE: zod_1.z
        .object({
        url: zod_1.z.string().max(2048).optional(),
        alt: safeStr(300).optional(),
    })
        .strip(),
    SERVICES: zod_1.z
        .object({
        heading: safeStr(200),
        items: zod_1.z.array(safeStr(200)).max(30),
    })
        .strip(),
    FEATURES: zod_1.z
        .object({
        heading: safeStr(200),
        items: zod_1.z.array(safeStr(200)).max(30),
    })
        .strip(),
    GALLERY: zod_1.z
        .object({
        heading: safeStr(200).optional(),
        images: zod_1.z
            .array(zod_1.z.object({
            url: zod_1.z.string().max(2048),
            alt: safeStr(300).optional(),
        }))
            .max(24)
            .optional(),
    })
        .strip(),
    TESTIMONIALS: zod_1.z
        .object({
        heading: safeStr(200).optional(),
        quote: safeStr(2000),
        author: safeStr(120).optional(),
    })
        .strip(),
    PRICING: zod_1.z
        .object({
        heading: safeStr(200).optional(),
        planName: safeStr(120),
        price: safeStr(80),
        features: zod_1.z.array(safeStr(200)).max(30).optional(),
    })
        .strip(),
    FAQ: zod_1.z
        .object({
        heading: safeStr(200).optional(),
        items: zod_1.z.array(faqItem).max(20),
    })
        .strip(),
    CONTACT: zod_1.z
        .object({
        heading: safeStr(200).optional(),
        email: safeStr(200).optional(),
        buttonText: safeStr(80).optional(),
    })
        .strip(),
    FOOTER: zod_1.z
        .object({
        copyright: safeStr(200).optional(),
        links: safeStr(500).optional(),
    })
        .strip(),
    COMPOSED: zod_1.z
        .object({
        schemaVersion: zod_1.z.literal(1),
        section: composed_section_schema_js_1.composedSectionDefinitionSchema,
    })
        .strip(),
};
function validateSectionData(type, data) {
    const schema = exports.sectionDataSchemas[type];
    return schema.parse(data ?? {});
}
const themeSchema = zod_1.z.object({
    colors: zod_1.z.record(zod_1.z.string(), zod_1.z.string().max(64)).optional(),
    typography: zod_1.z.record(zod_1.z.string(), zod_1.z.string().max(120)).optional(),
    buttons: zod_1.z.record(zod_1.z.string(), zod_1.z.string().max(64)).optional(),
});
const seoOutSchema = zod_1.z.object({
    title: safeStr(120).nullable().optional(),
    metaDescription: safeStr(320).nullable().optional(),
});
exports.aiWebsiteDraftSchema = zod_1.z.object({
    website: zod_1.z.object({
        name: safeStr(120),
        description: safeStr(500).optional(),
    }),
    theme: themeSchema,
    pages: zod_1.z
        .array(zod_1.z.object({
        name: safeStr(120),
        slug: safeStr(80),
        pageType: zod_1.z.enum(pages_model_js_1.PAGE_TYPES).optional(),
        seo: seoOutSchema.optional(),
        sections: zod_1.z
            .array(zod_1.z.object({
            type: zod_1.z.enum(pages_constants_js_1.SECTION_TYPES),
            order: zod_1.z.number().int().min(0),
            data: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).default({}),
            settings: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
        }))
            .min(1)
            .max(20),
    }))
        .min(1)
        .max(10),
});
exports.aiSectionResultSchema = zod_1.z.object({
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
    settings: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
exports.aiCreateSectionResultSchema = zod_1.z.object({
    type: zod_1.z.enum(pages_constants_js_1.SECTION_TYPES),
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
    settings: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
exports.aiSeoResultSchema = zod_1.z.object({
    seo: seoOutSchema,
});
function normalizeWebsiteDraft(raw) {
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
