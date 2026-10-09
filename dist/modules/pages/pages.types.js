"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicSection = toPublicSection;
exports.toPublicPage = toPublicPage;
exports.toPublicPageFromLean = toPublicPageFromLean;
function toPublicSection(doc) {
    return {
        id: doc._id.toString(),
        type: doc.type,
        order: doc.order,
        data: doc.data ?? {},
        settings: doc.settings ?? {},
    };
}
function toPublicPage(doc) {
    const sections = [...doc.sections]
        .sort((a, b) => a.order - b.order)
        .map(toPublicSection);
    return {
        id: doc._id.toString(),
        workspaceId: doc.workspaceId.toString(),
        websiteId: doc.websiteId.toString(),
        name: doc.name,
        slug: doc.slug,
        pageType: doc.pageType,
        status: doc.status,
        seo: {
            title: doc.seo?.title ?? null,
            metaDescription: doc.seo?.metaDescription ?? null,
            socialImage: doc.seo?.socialImage ?? null,
        },
        sections,
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
    };
}
function toPublicPageFromLean(doc) {
    const sections = [...doc.sections]
        .sort((a, b) => a.order - b.order)
        .map(toPublicSection);
    return {
        id: doc._id.toString(),
        workspaceId: doc.workspaceId.toString(),
        websiteId: doc.websiteId.toString(),
        name: doc.name,
        slug: doc.slug,
        pageType: doc.pageType,
        status: doc.status,
        seo: {
            title: doc.seo?.title ?? null,
            metaDescription: doc.seo?.metaDescription ?? null,
            socialImage: doc.seo?.socialImage ?? null,
        },
        sections,
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
    };
}
