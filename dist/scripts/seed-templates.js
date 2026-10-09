"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_js_1 = require("../database/mongodb.js");
const ocean_crown_template_js_1 = require("../modules/templates/catalog/ocean-crown.template.js");
const templates_model_js_1 = require("../modules/templates/templates.model.js");
const logger_js_1 = require("../utils/logger.js");
async function upsertTemplate(summary, definition, sortOrder) {
    const { id, name, category, description, previewThumbnailUrl } = summary;
    const { theme, pages } = definition;
    await templates_model_js_1.TemplateModel.findOneAndUpdate({ templateId: id }, {
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
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    logger_js_1.logger.info({ templateId: id }, "Template seeded");
}
async function main() {
    await (0, mongodb_js_1.connectMongo)();
    await upsertTemplate(ocean_crown_template_js_1.oceanCrownSummary, ocean_crown_template_js_1.oceanCrownTemplate, 0);
    await (0, mongodb_js_1.disconnectMongo)();
    logger_js_1.logger.info("Template seed complete");
}
main().catch((error) => {
    logger_js_1.logger.error({ err: error }, "Template seed failed");
    process.exit(1);
});
