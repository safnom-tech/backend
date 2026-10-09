"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAIProvider = void 0;
exports.setMockAiBehavior = setMockAiBehavior;
exports.getMockAiBehavior = getMockAiBehavior;
const error_middleware_js_1 = require("../../../middleware/error.middleware.js");
const prompt_to_hero_js_1 = require("../utils/prompt-to-hero.js");
const field_content_mock_js_1 = require("../content/field-content.mock.js");
const field_content_limits_js_1 = require("../content/field-content.limits.js");
const composed_section_mock_js_1 = require("../composed/composed-section.mock.js");
const composed_section_schema_js_1 = require("../composed/composed-section.schema.js");
let behavior = "normal";
function setMockAiBehavior(next) {
    behavior = next;
}
function getMockAiBehavior() {
    return behavior;
}
function parseBusinessFromPrompt(userPrompt) {
    try {
        return JSON.parse(userPrompt);
    }
    catch {
        const m = userPrompt.match(/"businessName"\s*:\s*"([^"]+)"/);
        return { businessName: m?.[1] ?? "Your Business" };
    }
}
function parseSectionRequest(userPrompt) {
    try {
        return JSON.parse(userPrompt);
    }
    catch {
        return {};
    }
}
function buildWebsiteDraft(input) {
    const name = input.businessName ?? "Your Business";
    const services = input.services?.length ? input.services : ["Service one", "Service two"];
    return {
        website: {
            name,
            description: input.businessDescription?.slice(0, 500) ?? `${name} online presence`,
        },
        theme: {
            colors: {
                primary: "#3da6ad",
                background: "#ffffff",
                text: "#1a3a4a",
            },
            typography: { headingFont: "system-ui", bodyFont: "system-ui" },
            buttons: { style: "rounded" },
        },
        pages: [
            {
                name: "Home",
                slug: "home",
                pageType: "HOME",
                seo: {
                    title: `${name} | ${input.location ?? "Local"}`,
                    metaDescription: input.businessDescription?.slice(0, 160) ?? name,
                },
                sections: [
                    {
                        type: "HEADER",
                        order: 0,
                        data: { logoText: name, navLabel: "Menu" },
                        settings: {},
                    },
                    (() => {
                        const hero = (0, prompt_to_hero_js_1.synthesizeHeroFromPrompt)(input.websiteStyle ?? "modern professional split hero", { businessName: name, businessType: input.businessType });
                        return {
                            type: "HERO",
                            order: 1,
                            data: {
                                ...hero.data,
                                title: `Welcome to ${name}`,
                                description: input.businessDescription?.slice(0, 500) ??
                                    String(hero.data.description ?? ""),
                                buttonText: "Contact us",
                                buttonUrl: "#contact",
                            },
                            settings: hero.settings,
                        };
                    })(),
                    {
                        type: "SERVICES",
                        order: 2,
                        data: { heading: "Our services", items: services },
                        settings: {},
                    },
                    {
                        type: "FAQ",
                        order: 3,
                        data: {
                            heading: "FAQ",
                            items: [{ q: "What do you offer?", a: services.join(", ") }],
                        },
                        settings: {},
                    },
                    {
                        type: "CONTACT",
                        order: 4,
                        data: {
                            heading: "Contact us",
                            email: "hello@example.com",
                            buttonText: "Get in touch",
                        },
                        settings: {},
                    },
                    {
                        type: "FOOTER",
                        order: 5,
                        data: { copyright: `© ${name}`, links: "Privacy · Terms" },
                        settings: {},
                    },
                ],
            },
        ],
    };
}
function sectionDataForType(type, action, current, ctx) {
    const name = ctx.businessName ?? "Your Business";
    if (action === "generate_about" || (type === "TEXT" && action.includes("about"))) {
        return {
            heading: `About ${name}`,
            body: `${name} serves customers with quality and care.`,
        };
    }
    if (action === "generate_services" || type === "SERVICES") {
        return {
            heading: "Our services",
            items: ctx.services?.length ? ctx.services : ["Consultation", "Support"],
        };
    }
    if (action === "generate_faqs" || type === "FAQ") {
        return {
            heading: "FAQ",
            items: [{ q: "How can I reach you?", a: "Use the contact section below." }],
        };
    }
    if (type === "HERO") {
        return {
            title: String(current.title ?? `Welcome to ${name}`),
            description: String(current.description ?? "Professional service you can rely on."),
            buttonText: String(current.buttonText ?? "Learn more"),
            buttonUrl: String(current.buttonUrl ?? "#contact"),
            secondaryButtonText: String(current.secondaryButtonText ?? ""),
            secondaryButtonUrl: String(current.secondaryButtonUrl ?? ""),
            imageUrl: String(current.imageUrl ?? ""),
            imageAlt: String(current.imageAlt ?? ""),
        };
    }
    if (type === "TESTIMONIALS") {
        return {
            heading: "What customers say",
            quote: String(current.quote ?? `${name} exceeded our expectations.`),
            author: String(current.author ?? "Happy customer"),
        };
    }
    if (type === "PRICING") {
        return {
            heading: "Pricing",
            planName: "Standard",
            price: "$99/mo",
            features: ["Feature one", "Feature two"],
        };
    }
    if (type === "CONTACT") {
        return {
            heading: "Contact us",
            email: "hello@example.com",
            buttonText: "Get in touch",
        };
    }
    if (type === "GALLERY") {
        return { heading: "Gallery", images: [] };
    }
    return { ...current, heading: String(current.heading ?? name) };
}
class MockAIProvider {
    name = "mock";
    async completeJson(input) {
        if (behavior === "timeout") {
            throw new error_middleware_js_1.AppError("AI request timed out", 504, "AI_TIMEOUT");
        }
        if (behavior === "bad_json") {
            return "not-json";
        }
        if (input.systemPrompt.includes("website generator")) {
            const business = parseBusinessFromPrompt(input.userPrompt);
            return buildWebsiteDraft(business);
        }
        if (input.systemPrompt.includes("field content generator")) {
            const req = JSON.parse(input.userPrompt);
            const fieldType = req.fieldType ?? "generic";
            const limits = (0, field_content_limits_js_1.resolveFieldLimits)(fieldType, req.maxChars, req.maxWords ?? undefined);
            const name = req.business?.businessName ?? "your business";
            const content = (0, field_content_mock_js_1.buildMockFieldContent)({
                fieldType,
                userPrompt: req.userPrompt ?? "content",
                businessName: name,
                limits,
            });
            return { content };
        }
        if (input.systemPrompt.includes("composed section generator")) {
            const req = JSON.parse(input.userPrompt);
            const prompt = req.userRequest ?? req.prompt ?? "Custom section";
            const mode = req.mode ?? "generate";
            const current = req.currentSection ?? null;
            const presetId = (0, composed_section_mock_js_1.resolveLayoutPresetId)(req.layoutPresetId, prompt);
            let raw;
            if (mode === "edit" && current) {
                raw = (0, composed_section_mock_js_1.editMockComposedSection)(current, prompt, req.layoutPresetId);
            }
            else if (mode === "regenerate") {
                raw = (0, composed_section_mock_js_1.regenerateMockComposedSection)(prompt, req.layoutPresetId, current);
            }
            else {
                raw = (0, composed_section_mock_js_1.buildMockComposedSectionFromPreset)(presetId, prompt);
            }
            const section = (0, composed_section_schema_js_1.normalizeComposedSection)(raw);
            return { section };
        }
        if (input.systemPrompt.includes("section builder")) {
            const req = JSON.parse(input.userPrompt);
            const prompt = req.prompt ?? "About us section";
            const type = (0, prompt_to_hero_js_1.inferCreateSectionType)(prompt);
            if (type === "HERO") {
                const hero = (0, prompt_to_hero_js_1.synthesizeHeroFromPrompt)(prompt, {
                    businessName: req.businessContext?.businessName,
                    businessType: req.businessContext?.businessType,
                });
                return { type: "HERO", ...hero };
            }
            const data = sectionDataForType(type, "generate", {}, {
                businessName: req.businessContext?.businessName,
                services: req.businessContext?.services,
            });
            if (type === "TEXT") {
                data.heading = "Why work with us";
                data.body =
                    "We focus on clarity, quality, and outcomes. Tell your story here in a few concise paragraphs.";
            }
            return { type, data, settings: { alignment: "left", paddingY: "md" } };
        }
        if (input.systemPrompt.includes("SEO assistant")) {
            const req = JSON.parse(input.userPrompt);
            const bn = req.businessContext?.businessName ?? "Business";
            return {
                seo: {
                    title: req.currentSeo?.title ?? `${bn} | Official Site`,
                    metaDescription: req.currentSeo?.metaDescription ??
                        `Learn more about ${bn} and our services.`,
                },
            };
        }
        const req = parseSectionRequest(input.userPrompt);
        const type = req.sectionType ?? "TEXT";
        const data = sectionDataForType(type, req.action ?? "generate", req.currentContent ?? {}, req.businessContext ?? {});
        const settings = { ...(req.currentSettings ?? {}) };
        if (req.action === "edit_from_prompt") {
            const instruction = (req.userInstruction ?? "").toLowerCase();
            if (instruction.includes("split") || instruction.includes("two column")) {
                settings.layout = "split";
                settings.imagePosition = "right";
            }
            if (instruction.includes("center")) {
                settings.layout = "center";
                settings.alignment = "center";
            }
            const suffix = req.userInstruction?.trim().slice(0, 120) ?? "Updated copy";
            if (typeof data.description === "string") {
                data.description = `${data.description} ${suffix}`.trim().slice(0, 800);
            }
            else if (typeof data.body === "string") {
                data.body = `${data.body} ${suffix}`.trim().slice(0, 4000);
            }
            else if (typeof data.heading === "string") {
                data.heading = `${data.heading} — refreshed`.slice(0, 200);
            }
            return { data, settings };
        }
        if (req.action === "shorten" && typeof data.body === "string") {
            data.body = String(data.body).split(" ").slice(0, 12).join(" ") + ".";
        }
        if (req.action === "professional" && typeof data.body === "string") {
            data.body = `We are committed to delivering professional excellence. ${data.body}`;
        }
        return { data, settings };
    }
}
exports.MockAIProvider = MockAIProvider;
