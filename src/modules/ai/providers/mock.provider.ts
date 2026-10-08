import { AppError } from "../../../middleware/error.middleware.js";
import type { GenerateWebsiteInput } from "../ai.types.js";
import {
  inferCreateSectionType,
  synthesizeHeroFromPrompt,
} from "../utils/prompt-to-hero.js";
import { buildMockFieldContent } from "../content/field-content.mock.js";
import { resolveFieldLimits, type FieldContentType } from "../content/field-content.limits.js";
import {
  buildMockComposedSectionFromPreset,
  editMockComposedSection,
  regenerateMockComposedSection,
  resolveLayoutPresetId,
} from "../composed/composed-section.mock.js";
import {
  normalizeComposedSection,
  type ComposedSectionDefinition,
} from "../composed/composed-section.schema.js";
import type { AICompletionInput, AIProvider } from "./ai.provider.types.js";

export type MockAiBehavior = "normal" | "bad_json" | "timeout";

let behavior: MockAiBehavior = "normal";

export function setMockAiBehavior(next: MockAiBehavior): void {
  behavior = next;
}

export function getMockAiBehavior(): MockAiBehavior {
  return behavior;
}

function parseBusinessFromPrompt(userPrompt: string): Partial<GenerateWebsiteInput> {
  try {
    return JSON.parse(userPrompt) as GenerateWebsiteInput;
  } catch {
    const m = userPrompt.match(/"businessName"\s*:\s*"([^"]+)"/);
    return { businessName: m?.[1] ?? "Your Business" };
  }
}

function parseSectionRequest(userPrompt: string): {
  action?: string;
  sectionType?: string;
  currentContent?: Record<string, unknown>;
  currentSettings?: Record<string, unknown>;
  userInstruction?: string;
  businessContext?: { businessName?: string; services?: string[] };
} {
  try {
    return JSON.parse(userPrompt) as ReturnType<typeof parseSectionRequest>;
  } catch {
    return {};
  }
}

function buildWebsiteDraft(input: Partial<GenerateWebsiteInput>) {
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
            const hero = synthesizeHeroFromPrompt(
              input.websiteStyle ?? "modern professional split hero",
              { businessName: name, businessType: input.businessType }
            );
            return {
              type: "HERO",
              order: 1,
              data: {
                ...hero.data,
                title: `Welcome to ${name}`,
                description:
                  input.businessDescription?.slice(0, 500) ??
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

function sectionDataForType(
  type: string,
  action: string,
  current: Record<string, unknown>,
  ctx: { businessName?: string; services?: string[] }
): Record<string, unknown> {
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
      description: String(
        current.description ?? "Professional service you can rely on."
      ),
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

export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async completeJson(input: AICompletionInput): Promise<unknown> {
    if (behavior === "timeout") {
      throw new AppError("AI request timed out", 504, "AI_TIMEOUT");
    }
    if (behavior === "bad_json") {
      return "not-json";
    }

    if (input.systemPrompt.includes("website generator")) {
      const business = parseBusinessFromPrompt(input.userPrompt);
      return buildWebsiteDraft(business);
    }

    if (input.systemPrompt.includes("field content generator")) {
      const req = JSON.parse(input.userPrompt) as {
        fieldType?: FieldContentType;
        userPrompt?: string;
        maxChars?: number;
        maxWords?: number | null;
        business?: { businessName?: string };
      };
      const fieldType = req.fieldType ?? "generic";
      const limits = resolveFieldLimits(
        fieldType,
        req.maxChars,
        req.maxWords ?? undefined
      );
      const name = req.business?.businessName ?? "your business";
      const content = buildMockFieldContent({
        fieldType,
        userPrompt: req.userPrompt ?? "content",
        businessName: name,
        limits,
      });
      return { content };
    }

    if (input.systemPrompt.includes("composed section generator")) {
      const req = JSON.parse(input.userPrompt) as {
        mode?: "generate" | "regenerate" | "edit";
        userRequest?: string;
        prompt?: string;
        layoutPresetId?: string;
        currentSection?: ComposedSectionDefinition | null;
      };
      const prompt = req.userRequest ?? req.prompt ?? "Custom section";
      const mode = req.mode ?? "generate";
      const current = req.currentSection ?? null;
      const presetId = resolveLayoutPresetId(req.layoutPresetId, prompt);
      let raw: ComposedSectionDefinition;
      if (mode === "edit" && current) {
        raw = editMockComposedSection(current, prompt, req.layoutPresetId);
      } else if (mode === "regenerate") {
        raw = regenerateMockComposedSection(prompt, req.layoutPresetId, current);
      } else {
        raw = buildMockComposedSectionFromPreset(presetId, prompt);
      }
      const section = normalizeComposedSection(raw);
      return { section };
    }

    if (input.systemPrompt.includes("section builder")) {
      const req = JSON.parse(input.userPrompt) as {
        prompt?: string;
        businessContext?: {
          businessName?: string;
          businessType?: string;
          services?: string[];
        };
      };
      const prompt = req.prompt ?? "About us section";
      const type = inferCreateSectionType(prompt);
      if (type === "HERO") {
        const hero = synthesizeHeroFromPrompt(prompt, {
          businessName: req.businessContext?.businessName,
          businessType: req.businessContext?.businessType,
        });
        return { type: "HERO", ...hero };
      }
      const data = sectionDataForType(
        type,
        "generate",
        {},
        {
          businessName: req.businessContext?.businessName,
          services: req.businessContext?.services,
        }
      );
      if (type === "TEXT") {
        data.heading = "Why work with us";
        data.body =
          "We focus on clarity, quality, and outcomes. Tell your story here in a few concise paragraphs.";
      }
      return { type, data, settings: { alignment: "left", paddingY: "md" } };
    }

    if (input.systemPrompt.includes("SEO assistant")) {
      const req = JSON.parse(input.userPrompt) as {
        businessContext?: { businessName?: string };
        currentSeo?: { title?: string; metaDescription?: string };
      };
      const bn = req.businessContext?.businessName ?? "Business";
      return {
        seo: {
          title: req.currentSeo?.title ?? `${bn} | Official Site`,
          metaDescription:
            req.currentSeo?.metaDescription ??
            `Learn more about ${bn} and our services.`,
        },
      };
    }

    const req = parseSectionRequest(input.userPrompt);
    const type = req.sectionType ?? "TEXT";
    const data = sectionDataForType(
      type,
      req.action ?? "generate",
      req.currentContent ?? {},
      req.businessContext ?? {}
    );
    const settings: Record<string, unknown> = { ...(req.currentSettings ?? {}) };

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
      } else if (typeof data.body === "string") {
        data.body = `${data.body} ${suffix}`.trim().slice(0, 4000);
      } else if (typeof data.heading === "string") {
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
