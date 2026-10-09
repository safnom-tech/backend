"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedWebsiteContent = seedWebsiteContent;
const mongoose_1 = require("mongoose");
const websites_model_js_1 = require("../websites/websites.model.js");
const pages_model_js_1 = require("./pages.model.js");
async function seedWebsiteContent(workspaceId, websiteId, input) {
    await websites_model_js_1.WebsiteModel.updateOne({
        _id: new mongoose_1.Types.ObjectId(websiteId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    }, { $set: { theme: input.theme } });
    for (const pageDef of input.pages) {
        const sections = pageDef.sections.map((s) => ({
            _id: new mongoose_1.Types.ObjectId(),
            type: s.type,
            order: s.order,
            data: { ...s.data },
            settings: { ...s.settings },
        }));
        await pages_model_js_1.PageModel.create({
            workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
            websiteId: new mongoose_1.Types.ObjectId(websiteId),
            name: pageDef.name,
            slug: pageDef.slug,
            pageType: pageDef.pageType ?? "CUSTOM",
            status: "DRAFT",
            seo: {
                title: pageDef.seo?.title ?? null,
                metaDescription: pageDef.seo?.metaDescription ?? null,
                socialImage: pageDef.seo?.socialImage ?? null,
            },
            sections,
        });
    }
}
