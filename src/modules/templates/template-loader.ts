import { AppError } from "../../middleware/error.middleware.js";
import type { TemplateDefinition } from "./templates.types.js";

const LOADERS: Record<string, () => Promise<Record<string, TemplateDefinition>>> =
  {
    "ocean-crown": () =>
      import("./catalog/ocean-crown.template.js").then((m) => ({
        oceanCrownTemplate: m.oceanCrownTemplate,
      })),
  };

const EXPORT_NAME: Record<string, string> = {
  "ocean-crown": "oceanCrownTemplate",
};

const cache = new Map<string, TemplateDefinition>();

export function isKnownTemplateId(templateId: string): boolean {
  return templateId in LOADERS;
}

export async function loadTemplateDefinition(
  templateId: string
): Promise<TemplateDefinition> {
  const cached = cache.get(templateId);
  if (cached) return cached;

  const loader = LOADERS[templateId];
  const exportName = EXPORT_NAME[templateId];
  if (!loader || !exportName) {
    throw new AppError("Template not found", 404, "TEMPLATE_NOT_FOUND");
  }

  const mod = await loader();
  const definition = mod[exportName] as TemplateDefinition | undefined;
  if (!definition || definition.id !== templateId) {
    throw new AppError("Template not found", 404, "TEMPLATE_NOT_FOUND");
  }

  cache.set(templateId, definition);
  return definition;
}

export function clearTemplateCacheForTests(): void {
  cache.clear();
}
