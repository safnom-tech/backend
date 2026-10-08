import { AppError } from "../../middleware/error.middleware.js";
import { env } from "../../config/env.js";
import { getTemplateCache } from "../../cache/template-cache.js";
import { TemplateModel } from "./templates.model.js";
import type { TemplateRepository } from "./template.repository.types.js";
import type {
  TemplateDefinition,
  TemplateListResult,
  PublicTemplateSummary,
} from "./templates.types.js";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;

function definitionCacheKey(templateId: string, version: number): string {
  return `tpl:def:${templateId}:v${version}`;
}

function docToDefinition(doc: {
  templateId: string;
  name: string;
  category: TemplateDefinition["category"];
  description: string;
  theme: TemplateDefinition["theme"];
  pages: TemplateDefinition["pages"];
}): TemplateDefinition {
  return {
    id: doc.templateId,
    name: doc.name,
    category: doc.category,
    description: doc.description,
    theme: doc.theme,
    pages: doc.pages,
  };
}

function docToSummary(doc: {
  templateId: string;
  name: string;
  category: TemplateDefinition["category"];
  description: string;
  previewThumbnailUrl?: string | null;
}): PublicTemplateSummary {
  return {
    id: doc.templateId,
    name: doc.name,
    category: doc.category,
    description: doc.description,
    previewThumbnailUrl: doc.previewThumbnailUrl ?? null,
  };
}

export class MongoTemplateRepository implements TemplateRepository {
  async list(input?: {
    limit?: number;
    offset?: number;
  }): Promise<TemplateListResult> {
    const limit = Math.min(
      Math.max(input?.limit ?? DEFAULT_LIST_LIMIT, 1),
      MAX_LIST_LIMIT
    );
    const offset = Math.max(input?.offset ?? 0, 0);
    const filter = { published: true };

    const [docs, total] = await Promise.all([
      TemplateModel.find(filter)
        .sort({ sortOrder: 1, templateId: 1 })
        .skip(offset)
        .limit(limit)
        .select(
          "templateId name category description previewThumbnailUrl"
        )
        .lean(),
      TemplateModel.countDocuments(filter),
    ]);

    return {
      templates: docs.map(docToSummary),
      total,
      limit,
      offset,
    };
  }

  async getDefinition(templateId: string): Promise<TemplateDefinition> {
    const id = templateId.trim().toLowerCase();
    const meta = await TemplateModel.findOne({ templateId: id, published: true })
      .select("templateId version")
      .lean();
    if (!meta) {
      throw new AppError("Template not found", 404, "TEMPLATE_NOT_FOUND");
    }

    const cache = getTemplateCache();
    const key = definitionCacheKey(id, meta.version);
    const cached = await cache.get(key);
    if (cached) {
      return JSON.parse(cached) as TemplateDefinition;
    }

    const doc = await TemplateModel.findOne({ templateId: id, published: true }).lean();
    if (!doc) {
      throw new AppError("Template not found", 404, "TEMPLATE_NOT_FOUND");
    }

    const definition = docToDefinition(doc);
    await cache.set(
      key,
      JSON.stringify(definition),
      env.templateCacheTtlSeconds
    );
    return definition;
  }

  async exists(templateId: string): Promise<boolean> {
    const id = templateId.trim().toLowerCase();
    const n = await TemplateModel.countDocuments({
      templateId: id,
      published: true,
    });
    return n > 0;
  }
}
