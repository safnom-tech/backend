"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicWebsite = toPublicWebsite;
exports.toPublicWebsiteFromLean = toPublicWebsiteFromLean;
function toPublicWebsite(doc, options) {
    return {
        id: doc._id.toString(),
        workspaceId: doc.workspaceId.toString(),
        name: doc.name,
        description: doc.description ?? null,
        slug: doc.slug,
        publicId: doc.publicId ?? "",
        subscriptionId: doc.subscriptionId ?? "",
        status: doc.status,
        subdomain: doc.subdomain ?? null,
        publishedAt: doc.publishedAt ?? null,
        publishedVersion: doc.publishedVersion ?? 0,
        hasUnpublishedChanges: options?.hasUnpublishedChanges ?? false,
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
        publicId: doc.publicId ?? "",
        subscriptionId: doc.subscriptionId ?? "",
        status: doc.status,
        subdomain: doc.subdomain ?? null,
        publishedAt: doc.publishedAt ?? null,
        publishedVersion: doc.publishedVersion ?? 0,
        hasUnpublishedChanges: false,
        theme: doc.theme ?? {},
        settings: doc.settings ?? {},
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
    };
}
