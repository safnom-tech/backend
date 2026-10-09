"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESERVED_SUBDOMAINS = void 0;
exports.isReservedSubdomain = isReservedSubdomain;
/** System subdomains that cannot be assigned to customer websites. */
exports.RESERVED_SUBDOMAINS = new Set([
    "www",
    "app",
    "admin",
    "api",
    "dashboard",
    "login",
    "signup",
    "auth",
    "support",
    "help",
    "mail",
    "status",
    "static",
    "assets",
    "cdn",
]);
function isReservedSubdomain(subdomain) {
    return exports.RESERVED_SUBDOMAINS.has(subdomain.trim().toLowerCase());
}
