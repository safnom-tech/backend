"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicWorkspace = toPublicWorkspace;
exports.toPublicWorkspaceFromLean = toPublicWorkspaceFromLean;
function toPublicWorkspace(doc) {
    return {
        id: doc._id.toString(),
        name: doc.name,
        slug: doc.slug,
        ownerId: doc.ownerId.toString(),
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
    };
}
function toPublicWorkspaceFromLean(doc) {
    return {
        id: doc._id.toString(),
        name: doc.name,
        slug: doc.slug,
        ownerId: doc.ownerId.toString(),
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
    };
}
