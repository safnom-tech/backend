"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPrivateHttpCache = setPrivateHttpCache;
/** Short private cache for authenticated catalog reads (per-user browser cache). */
function setPrivateHttpCache(res, maxAgeSeconds) {
    res.setHeader("Cache-Control", `private, max-age=${maxAgeSeconds}`);
}
