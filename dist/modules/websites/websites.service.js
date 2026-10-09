"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeHasUnpublishedChanges = computeHasUnpublishedChanges;
exports.getWebsitePreview = getWebsitePreview;
exports.assertWebsiteInWorkspace = assertWebsiteInWorkspace;
exports.createWebsite = createWebsite;
exports.listWebsitesForWorkspace = listWebsitesForWorkspace;
exports.getWebsite = getWebsite;
exports.updateWebsite = updateWebsite;
exports.deleteWebsite = deleteWebsite;
const mongoose_1 = require("mongoose");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const public_id_js_1 = require("../../utils/public-id.js");
const slugify_js_1 = require("../../utils/slugify.js");
const websites_model_js_1 = require("./websites.model.js");
const pages_model_js_1 = require("../pages/pages.model.js");
const websites_types_js_1 = require("./websites.types.js");
const pages_service_js_1 = require("../pages/pages.service.js");
async function computeHasUnpublishedChanges(website) {
    if (website.status !== "PUBLISHED" || !website.publishedAt) {
        return false;
    }
    const publishedAt = website.publishedAt;
    if (website.updatedAt && website.updatedAt > publishedAt) {
        return true;
    }
    const newerPage = await pages_model_js_1.PageModel.findOne({
        websiteId: website._id,
        updatedAt: { $gt: publishedAt },
    })
        .select("_id")
        .lean();
    return Boolean(newerPage);
}
async function toPublicWebsiteWithPublishingFlags(doc) {
    const hasUnpublishedChanges = await computeHasUnpublishedChanges(doc);
    return (0, websites_types_js_1.toPublicWebsite)(doc, { hasUnpublishedChanges });
}
function toPreviewSummary(p) {
    return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        pageType: p.pageType,
        seo: p.seo,
    };
}
async function getWebsitePreview(workspaceId, websiteId, slug) {
    const website = await assertWebsiteInWorkspace(workspaceId, websiteId);
    const pages = await (0, pages_service_js_1.listPagesForWebsite)(workspaceId, websiteId);
    if (pages.length === 0) {
        throw new error_middleware_js_1.AppError("No pages to preview", 404, "PAGE_NOT_FOUND");
    }
    const requested = slug?.trim().toLowerCase();
    let page;
    if (requested) {
        const match = pages.find((p) => p.slug === requested);
        if (!match) {
            throw new error_middleware_js_1.AppError("Page not found", 404, "PAGE_NOT_FOUND");
        }
        page = match;
    }
    else {
        page =
            pages.find((p) => p.pageType === "HOME") ??
                pages.find((p) => p.slug === "home") ??
                pages[0];
    }
    return {
        website,
        pages: pages.map(toPreviewSummary),
        page,
    };
}
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
async function allocateWebsiteIdentities() {
    for (let attempt = 0; attempt < 16; attempt += 1) {
        const publicId = (0, public_id_js_1.generatePrefixedPublicId)("WEB");
        const subscriptionId = (0, public_id_js_1.generatePrefixedPublicId)("SAF");
        const clash = await websites_model_js_1.WebsiteModel.exists({
            $or: [{ publicId }, { subscriptionId }],
        });
        if (!clash) {
            return { publicId, subscriptionId };
        }
    }
    throw new error_middleware_js_1.AppError("Could not allocate website identity", 500, "WEBSITE_ID_GENERATION_FAILED");
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
    return toPublicWebsiteWithPublishingFlags(await ensureWebsiteIdentities(website));
}
async function ensureWebsiteIdentities(website) {
    if (website.publicId && website.subscriptionId) {
        return website;
    }
    const ids = await allocateWebsiteIdentities();
    if (!website.publicId)
        website.publicId = ids.publicId;
    if (!website.subscriptionId)
        website.subscriptionId = ids.subscriptionId;
    await website.save();
    return website;
}
async function createWebsite(workspaceId, input) {
    const slug = await generateUniqueWebsiteSlug(workspaceId, input.name);
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const { publicId, subscriptionId } = await allocateWebsiteIdentities();
        try {
            const website = await websites_model_js_1.WebsiteModel.create({
                workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
                name: input.name.trim(),
                description: input.description?.trim() ?? null,
                slug,
                publicId,
                subscriptionId,
                status: "DRAFT",
            });
            return toPublicWebsiteWithPublishingFlags(website);
        }
        catch (err) {
            if (err &&
                typeof err === "object" &&
                "code" in err &&
                err.code === 11000) {
                const keys = err &&
                    typeof err === "object" &&
                    "keyPattern" in err &&
                    err.keyPattern
                    ? Object.keys(err.keyPattern)
                    : [];
                if (keys.includes("publicId") || keys.includes("subscriptionId")) {
                    continue;
                }
                throw new error_middleware_js_1.AppError("Slug already taken", 409, "WEBSITE_SLUG_TAKEN");
            }
            throw err;
        }
    }
    throw new error_middleware_js_1.AppError("Could not allocate website identity", 500, "WEBSITE_ID_GENERATION_FAILED");
}
async function listWebsitesForWorkspace(workspaceId) {
    const websites = await websites_model_js_1.WebsiteModel.find({
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    }).sort({ updatedAt: -1 });
    const out = [];
    for (const website of websites) {
        out.push(await toPublicWebsiteWithPublishingFlags(await ensureWebsiteIdentities(website)));
    }
    return out;
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
    return toPublicWebsiteWithPublishingFlags(website);
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
