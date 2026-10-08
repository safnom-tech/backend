"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugifyName = slugifyName;
exports.isValidSlug = isValidSlug;
/** URL-safe slug from display name */
function slugifyName(name) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64);
}
function isValidSlug(slug) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2;
}
