"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREVIEW_CACHE_TTL_SECONDS = void 0;
exports.previewCacheKey = previewCacheKey;
const node_crypto_1 = require("node:crypto");
exports.PREVIEW_CACHE_TTL_SECONDS = 60;
function previewCacheKey(workspaceId, templateId, profile) {
    const hash = (0, node_crypto_1.createHash)("sha256")
        .update(JSON.stringify(profile ?? {}))
        .digest("hex")
        .slice(0, 16);
    return `tpl:preview:${workspaceId}:${templateId}:${hash}`;
}
