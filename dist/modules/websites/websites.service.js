"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertWebsiteInWorkspace = assertWebsiteInWorkspace;
exports.createWebsite = createWebsite;
exports.listWebsitesForWorkspace = listWebsitesForWorkspace;
exports.getWebsite = getWebsite;
exports.updateWebsite = updateWebsite;
exports.deleteWebsite = deleteWebsite;
const mongoose_1 = require("mongoose");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const slugify_js_1 = require("../../utils/slugify.js");
const websites_model_js_1 = require("./websites.model.js");
const websites_types_js_1 = require("./websites.types.js");
const pages_service_js_1 = require("../pages/pages.service.js");
async function generateUniqueWebsiteSlug(workspaceId, baseName) {
    let base = (0, slugify_js_1.slugifyName)(baseName) || "site";
    if (!(0, slugify_js_1.isValidSlug)(base)) {
        base = "site";
    }
    let candidate = base;
    let suffix = 2;
    while (await websites_model_js_1.WebsiteModel.exists({
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
        slug: candidate,
    })) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
        if (suffix > 100) {
            throw new error_middleware_js_1.AppError("Could not generate slug", 409, "WEBSITE_SLUG_TAKEN");
        }
    }
    return candidate;
}
async function assertWebsiteInWorkspace(workspaceId, websiteId) {
    if (!mongoose_1.Types.ObjectId.isValid(websiteId)) {
        throw new error_middleware_js_1.AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
    }
    const website = await websites_model_js_1.WebsiteModel.findOne({
        _id: new mongoose_1.Types.ObjectId(websiteId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    });
    if (!website) {
        throw new error_middleware_js_1.AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
    }
    return (0, websites_types_js_1.toPublicWebsite)(website);
}
async function createWebsite(workspaceId, input) {
    const slug = await generateUniqueWebsiteSlug(workspaceId, input.name);
    try {
        const website = await websites_model_js_1.WebsiteModel.create({
            workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
            name: input.name.trim(),
            description: input.description?.trim() ?? null,
            slug,
            status: "DRAFT",
        });
        return (0, websites_types_js_1.toPublicWebsite)(website);
    }
    catch (err) {
        if (err &&
            typeof err === "object" &&
            "code" in err &&
            err.code === 11000) {
            throw new error_middleware_js_1.AppError("Slug already taken", 409, "WEBSITE_SLUG_TAKEN");
        }
        throw err;
    }
}
async function listWebsitesForWorkspace(workspaceId) {
    const websites = await websites_model_js_1.WebsiteModel.find({
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    })
        .sort({ updatedAt: -1 })
        .lean();
    return websites.map((w) => (0, websites_types_js_1.toPublicWebsiteFromLean)(w));
}
async function getWebsite(workspaceId, websiteId) {
    return assertWebsiteInWorkspace(workspaceId, websiteId);
}
async function updateWebsite(workspaceId, websiteId, input) {
    await assertWebsiteInWorkspace(workspaceId, websiteId);
    const update = {};
    if (input.name !== undefined) {
        update.name = input.name.trim();
    }
    if (input.description !== undefined) {
        update.description = input.description;
    }
    if (input.status !== undefined) {
        update.status = input.status;
    }
    if (input.theme !== undefined) {
        const existing = await websites_model_js_1.WebsiteModel.findOne({
            _id: new mongoose_1.Types.ObjectId(websiteId),
            workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
        }).lean();
        const prev = existing?.theme ?? {};
        update.theme = {
            ...prev,
            ...input.theme,
            colors: {
                ...(prev.colors ?? {}),
                ...(input.theme.colors ?? {}),
            },
            typography: {
                ...(prev.typography ?? {}),
                ...(input.theme.typography ?? {}),
            },
            buttons: {
                ...(prev.buttons ?? {}),
                ...(input.theme.buttons ?? {}),
            },
        };
    }
    const website = await websites_model_js_1.WebsiteModel.findOneAndUpdate({
        _id: new mongoose_1.Types.ObjectId(websiteId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    }, update, { new: true });
    if (!website) {
        throw new error_middleware_js_1.AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
    }
    return (0, websites_types_js_1.toPublicWebsite)(website);
}
async function deleteWebsite(workspaceId, websiteId) {
    await assertWebsiteInWorkspace(workspaceId, websiteId);
    await (0, pages_service_js_1.deletePagesForWebsite)(websiteId);
    const result = await websites_model_js_1.WebsiteModel.deleteOne({
        _id: new mongoose_1.Types.ObjectId(websiteId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    });
    if (result.deletedCount === 0) {
        throw new error_middleware_js_1.AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
    }
}
