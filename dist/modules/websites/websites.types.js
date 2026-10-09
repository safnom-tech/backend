"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicWebsite = toPublicWebsite;
exports.toPublicWebsiteFromLean = toPublicWebsiteFromLean;
function toPublicWebsite(doc) {
    return {
        id: doc._id.toString(),
        workspaceId: doc.workspaceId.toString(),
        name: doc.name,
        description: doc.description ?? null,
        slug: doc.slug,
        status: doc.status,
        theme: doc.theme ?? {},
        settings: doc.settings ?? {},
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
    };
}
function toPublicWebsiteFromLean(doc) {
    return {
        id: doc._id.toString(),
        workspaceId: doc.workspaceId.toString(),
        name: doc.name,
        description: doc.description ?? null,
        slug: doc.slug,
        status: doc.status,
        theme: doc.theme ?? {},
        settings: doc.settings ?? {},
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
    };
}
