"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicUser = toPublicUser;
function toPublicUser(doc) {
    return {
        id: doc._id.toString(),
        email: doc.email,
        name: doc.name ?? null,
        emailVerified: doc.emailVerified,
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
    };
}
