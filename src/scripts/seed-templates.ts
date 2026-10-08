import { connectMongo, disconnectMongo } from "../database/mongodb.js";
import {
  oceanCrownSummary,
  oceanCrownTemplate,
} from "../modules/templates/catalog/ocean-crown.template.js";
import { TemplateModel } from "../modules/templates/templates.model.js";
import { logger } from "../utils/logger.js";

async function upsertTemplate(
  summary: typeof oceanCrownSummary,
  definition: typeof oceanCrownTemplate,
  sortOrder: number
): Promise<void> {
  const { id, name, category, description, previewThumbnailUrl } = summary;
  const { theme, pages } = definition;

  await TemplateModel.findOneAndUpdate(
    { templateId: id },
    {
      templateId: id,
      name,
      category,
      description,
      previewThumbnailUrl: previewThumbnailUrl ?? null,
      theme,
      pages,
      version: 1,
      published: true,
      sortOrder,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  logger.info({ templateId: id }, "Template seeded");
}

async function main(): Promise<void> {
  await connectMongo();
  await upsertTemplate(oceanCrownSummary, oceanCrownTemplate, 0);
  await disconnectMongo();
  logger.info("Template seed complete");
}

main().catch((error) => {
  logger.error({ err: error }, "Template seed failed");
  process.exit(1);
});
