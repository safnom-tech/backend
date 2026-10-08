import type {
  TemplateDefinition,
  TemplateListResult,
} from "./templates.types.js";

export interface TemplateRepository {
  list(input?: { limit?: number; offset?: number }): Promise<TemplateListResult>;
  getDefinition(templateId: string): Promise<TemplateDefinition>;
  exists(templateId: string): Promise<boolean>;
}
