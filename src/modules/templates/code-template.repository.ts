import { AppError } from "../../middleware/error.middleware.js";
import { TEMPLATE_MANIFEST } from "./template.manifest.js";
import { loadTemplateDefinition } from "./template-loader.js";
import type { TemplateRepository } from "./template.repository.types.js";
import type { TemplateListResult } from "./templates.types.js";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;

export class CodeTemplateRepository implements TemplateRepository {
  async list(input?: {
    limit?: number;
    offset?: number;
  }): Promise<TemplateListResult> {
    const total = TEMPLATE_MANIFEST.length;
    const limit = Math.min(
      Math.max(input?.limit ?? DEFAULT_LIST_LIMIT, 1),
      MAX_LIST_LIMIT
    );
    const offset = Math.max(input?.offset ?? 0, 0);
    const templates = TEMPLATE_MANIFEST.slice(offset, offset + limit);
    return { templates, total, limit, offset };
  }

  async getDefinition(templateId: string) {
    return loadTemplateDefinition(templateId);
  }

  async exists(templateId: string): Promise<boolean> {
    try {
      await loadTemplateDefinition(templateId);
      return true;
    } catch (error) {
      if (error instanceof AppError && error.code === "TEMPLATE_NOT_FOUND") {
        return false;
      }
      throw error;
    }
  }
}
