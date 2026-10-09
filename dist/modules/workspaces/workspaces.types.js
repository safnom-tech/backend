"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicWorkspace = toPublicWorkspace;
exports.toPublicWorkspaceFromLean = toPublicWorkspaceFromLean;
const business_profile_types_js_1 = require("./business-profile.types.js");
function toPublicWorkspace(doc) {
    return {
        id: doc._id.toString(),
        name: doc.name,
        slug: doc.slug,
        ownerId: doc.ownerId.toString(),
        businessProfile: (0, business_profile_types_js_1.normalizeBusinessProfile)(doc.businessProfile),
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
        businessProfile: (0, business_profile_types_js_1.normalizeBusinessProfile)(doc.businessProfile),
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
    };
}
