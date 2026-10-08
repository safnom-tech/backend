"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertPageInWebsite = assertPageInWebsite;
exports.createPage = createPage;
exports.listPagesForWebsite = listPagesForWebsite;
exports.getPage = getPage;
exports.updatePage = updatePage;
exports.deletePage = deletePage;
exports.deletePagesForWebsite = deletePagesForWebsite;
exports.addSection = addSection;
exports.updateSection = updateSection;
exports.deleteSection = deleteSection;
exports.duplicateSection = duplicateSection;
exports.reorderSections = reorderSections;
const mongoose_1 = require("mongoose");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const slugify_js_1 = require("../../utils/slugify.js");
const websites_service_js_1 = require("../websites/websites.service.js");
const pages_model_js_1 = require("./pages.model.js");
const pages_types_js_1 = require("./pages.types.js");
async function generateUniquePageSlug(websiteId, baseName) {
    let base = (0, slugify_js_1.slugifyName)(baseName) || "page";
    if (!(0, slugify_js_1.isValidSlug)(base)) {
        base = "page";
    }
    let candidate = base;
    let suffix = 2;
    while (await pages_model_js_1.PageModel.exists({
        websiteId: new mongoose_1.Types.ObjectId(websiteId),
        slug: candidate,
    })) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
        if (suffix > 100) {
            throw new error_middleware_js_1.AppError("Could not generate slug", 409, "PAGE_SLUG_TAKEN");
        }
    }
    return candidate;
}
async function assertPageInWebsite(workspaceId, websiteId, pageId) {
    await (0, websites_service_js_1.assertWebsiteInWorkspace)(workspaceId, websiteId);
    if (!mongoose_1.Types.ObjectId.isValid(pageId)) {
        throw new error_middleware_js_1.AppError("Page not found", 404, "PAGE_NOT_FOUND");
    }
    const page = await pages_model_js_1.PageModel.findOne({
        _id: new mongoose_1.Types.ObjectId(pageId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
        websiteId: new mongoose_1.Types.ObjectId(websiteId),
    });
    if (!page) {
        throw new error_middleware_js_1.AppError("Page not found", 404, "PAGE_NOT_FOUND");
    }
    return (0, pages_types_js_1.toPublicPage)(page);
}
async function loadPageDoc(workspaceId, websiteId, pageId) {
    await (0, websites_service_js_1.assertWebsiteInWorkspace)(workspaceId, websiteId);
    if (!mongoose_1.Types.ObjectId.isValid(pageId)) {
        throw new error_middleware_js_1.AppError("Page not found", 404, "PAGE_NOT_FOUND");
    }
    const page = await pages_model_js_1.PageModel.findOne({
        _id: new mongoose_1.Types.ObjectId(pageId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
        websiteId: new mongoose_1.Types.ObjectId(websiteId),
    });
    if (!page) {
        throw new error_middleware_js_1.AppError("Page not found", 404, "PAGE_NOT_FOUND");
    }
    return page;
}
function nextSectionOrder(page) {
    if (page.sections.length === 0)
        return 0;
    return Math.max(...page.sections.map((s) => s.order)) + 1;
}
async function createPage(workspaceId, websiteId, input) {
    await (0, websites_service_js_1.assertWebsiteInWorkspace)(workspaceId, websiteId);
    const slug = input.slug?.trim() ||
        (await generateUniquePageSlug(websiteId, input.name));
    if (!(0, slugify_js_1.isValidSlug)(slug)) {
        throw new error_middleware_js_1.AppError("Invalid slug", 400, "VALIDATION_ERROR");
    }
    try {
        const page = await pages_model_js_1.PageModel.create({
            workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
            websiteId: new mongoose_1.Types.ObjectId(websiteId),
            name: input.name.trim(),
            slug: slug.toLowerCase(),
            pageType: input.pageType ?? "CUSTOM",
            status: "DRAFT",
            seo: {
                title: input.seo?.title ?? null,
                metaDescription: input.seo?.metaDescription ?? null,
                socialImage: input.seo?.socialImage ?? null,
            },
            sections: [],
        });
        return (0, pages_types_js_1.toPublicPage)(page);
    }
    catch (err) {
        if (err &&
            typeof err === "object" &&
            "code" in err &&
            err.code === 11000) {
            throw new error_middleware_js_1.AppError("Slug already taken", 409, "PAGE_SLUG_TAKEN");
        }
        throw err;
    }
}
async function listPagesForWebsite(workspaceId, websiteId) {
    await (0, websites_service_js_1.assertWebsiteInWorkspace)(workspaceId, websiteId);
    const pages = await pages_model_js_1.PageModel.find({
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
        websiteId: new mongoose_1.Types.ObjectId(websiteId),
    }).sort({ updatedAt: -1 });
    return pages.map((p) => (0, pages_types_js_1.toPublicPage)(p));
}
async function getPage(workspaceId, websiteId, pageId) {
    return assertPageInWebsite(workspaceId, websiteId, pageId);
}
async function updatePage(workspaceId, websiteId, pageId, input) {
    const page = await loadPageDoc(workspaceId, websiteId, pageId);
    if (input.name !== undefined) {
        page.name = input.name.trim();
    }
    if (input.slug !== undefined) {
        const slug = input.slug.trim().toLowerCase();
        if (!(0, slugify_js_1.isValidSlug)(slug)) {
            throw new error_middleware_js_1.AppError("Invalid slug", 400, "VALIDATION_ERROR");
        }
        page.slug = slug;
    }
    if (input.pageType !== undefined) {
        page.pageType = input.pageType;
    }
    if (input.status !== undefined) {
        page.status = input.status;
    }
    if (input.seo !== undefined) {
        page.seo = {
            title: input.seo.title ?? page.seo?.title ?? null,
            metaDescription: input.seo.metaDescription ?? page.seo?.metaDescription ?? null,
            socialImage: input.seo.socialImage ?? page.seo?.socialImage ?? null,
        };
    }
    try {
        await page.save();
        return (0, pages_types_js_1.toPublicPage)(page);
    }
    catch (err) {
        if (err &&
            typeof err === "object" &&
            "code" in err &&
            err.code === 11000) {
            throw new error_middleware_js_1.AppError("Slug already taken", 409, "PAGE_SLUG_TAKEN");
        }
        throw err;
    }
}
async function deletePage(workspaceId, websiteId, pageId) {
    const result = await pages_model_js_1.PageModel.deleteOne({
        _id: new mongoose_1.Types.ObjectId(pageId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
        websiteId: new mongoose_1.Types.ObjectId(websiteId),
    });
    if (result.deletedCount === 0) {
        throw new error_middleware_js_1.AppError("Page not found", 404, "PAGE_NOT_FOUND");
    }
}
async function deletePagesForWebsite(websiteId) {
    await pages_model_js_1.PageModel.deleteMany({
        websiteId: new mongoose_1.Types.ObjectId(websiteId),
    });
}
async function addSection(workspaceId, websiteId, pageId, input) {
    const page = await loadPageDoc(workspaceId, websiteId, pageId);
    const order = input.order ?? nextSectionOrder(page);
    page.sections.push({
        _id: new mongoose_1.Types.ObjectId(),
        type: input.type,
        order,
        data: input.data ?? {},
        settings: input.settings ?? {},
    });
    await page.save();
    const added = page.sections[page.sections.length - 1];
    return (0, pages_types_js_1.toPublicSection)(added);
}
async function updateSection(workspaceId, websiteId, pageId, sectionId, input) {
    const page = await loadPageDoc(workspaceId, websiteId, pageId);
    const section = page.sections.id(sectionId);
    if (!section) {
        throw new error_middleware_js_1.AppError("Section not found", 404, "SECTION_NOT_FOUND");
    }
    if (input.type !== undefined) {
        section.type = input.type;
    }
    if (input.order !== undefined) {
        section.order = input.order;
    }
    if (input.data !== undefined) {
        section.data = input.data;
    }
    if (input.settings !== undefined) {
        section.settings = input.settings;
    }
    await page.save();
    return (0, pages_types_js_1.toPublicSection)(section);
}
async function deleteSection(workspaceId, websiteId, pageId, sectionId) {
    const page = await loadPageDoc(workspaceId, websiteId, pageId);
    const section = page.sections.id(sectionId);
    if (!section) {
        throw new error_middleware_js_1.AppError("Section not found", 404, "SECTION_NOT_FOUND");
    }
    section.deleteOne();
    await page.save();
}
async function duplicateSection(workspaceId, websiteId, pageId, sectionId) {
    const page = await loadPageDoc(workspaceId, websiteId, pageId);
    const source = page.sections.id(sectionId);
    if (!source) {
        throw new error_middleware_js_1.AppError("Section not found", 404, "SECTION_NOT_FOUND");
    }
    const order = source.order + 1;
    for (const s of page.sections) {
        if (s.order > source.order) {
            s.order += 1;
        }
    }
    page.sections.push({
        _id: new mongoose_1.Types.ObjectId(),
        type: source.type,
        order,
        data: { ...source.data },
        settings: { ...source.settings },
    });
    await page.save();
    const dup = page.sections[page.sections.length - 1];
    return (0, pages_types_js_1.toPublicSection)(dup);
}
async function reorderSections(workspaceId, websiteId, pageId, sectionIds) {
    const page = await loadPageDoc(workspaceId, websiteId, pageId);
    const idSet = new Set(sectionIds);
    if (idSet.size !== sectionIds.length) {
        throw new error_middleware_js_1.AppError("Duplicate section IDs", 400, "VALIDATION_ERROR");
    }
    if (idSet.size !== page.sections.length) {
        throw new error_middleware_js_1.AppError("sectionIds must include every section on the page", 400, "VALIDATION_ERROR");
    }
    for (const sid of sectionIds) {
        if (!page.sections.id(sid)) {
            throw new error_middleware_js_1.AppError("Section not found", 404, "SECTION_NOT_FOUND");
        }
    }
    sectionIds.forEach((sid, index) => {
        const section = page.sections.id(sid);
        if (section) {
            section.order = index;
        }
    });
    await page.save();
    return [...page.sections]
        .sort((a, b) => a.order - b.order)
        .map(pages_types_js_1.toPublicSection);
}
