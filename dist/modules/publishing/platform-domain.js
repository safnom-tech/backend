"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePlatformDomainList = parsePlatformDomainList;
exports.resolvePlatformBaseDomain = resolvePlatformBaseDomain;
exports.parseTenantSubdomainFromHost = parseTenantSubdomainFromHost;
exports.buildTenantSiteUrl = buildTenantSiteUrl;
exports.hostFromRequestHeaders = hostFromRequestHeaders;
const reserved_subdomains_js_1 = require("./reserved-subdomains.js");
function parsePlatformDomainList(raw) {
    if (!raw?.trim()) {
        return ["safnom.site"];
    }
    const domains = raw
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
    return domains.length > 0 ? domains : ["safnom.site"];
}
function sortDomainsLongestFirst(domains) {
    return [...domains].sort((a, b) => b.length - a.length);
}
/** Apex platform domain for this host (e.g. app.safnom.in → safnom.in). */
function resolvePlatformBaseDomain(host, platformDomains) {
    const hostname = host.split(":")[0]?.toLowerCase() ?? "";
    if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
        return null;
    }
    for (const platform of sortDomainsLongestFirst(platformDomains)) {
        if (hostname === platform || hostname === `www.${platform}`) {
            return platform;
        }
        const suffix = `.${platform}`;
        if (hostname.endsWith(suffix)) {
            return platform;
        }
    }
    return null;
}
/** Customer site slug from host (e.g. business.safnom.site → business). */
function parseTenantSubdomainFromHost(host, platformDomains) {
    const hostname = host.split(":")[0]?.toLowerCase() ?? "";
    const platform = resolvePlatformBaseDomain(host, platformDomains);
    if (!platform)
        return null;
    if (hostname === platform || hostname === `www.${platform}`) {
        return null;
    }
    const suffix = `.${platform}`;
    if (!hostname.endsWith(suffix))
        return null;
    const sub = hostname.slice(0, -suffix.length);
    if (!sub || sub.includes("."))
        return null;
    if ((0, reserved_subdomains_js_1.isReservedSubdomain)(sub))
        return null;
    return sub;
}
function buildTenantSiteUrl(subdomain, platformDomain, options) {
    const protocol = options?.protocol ?? "https";
    const port = options?.port?.trim();
    const portSuffix = port && port !== "80" && port !== "443" ? `:${port}` : "";
    return `${protocol}//${subdomain}.${platformDomain}${portSuffix}`;
}
function hostFromRequestHeaders(headers) {
    if (headers.origin) {
        try {
            return new URL(headers.origin).host;
        }
        catch {
            /* ignore */
        }
    }
    const forwarded = headers["x-forwarded-host"];
    if (typeof forwarded === "string" && forwarded.trim()) {
        return forwarded.split(",")[0]?.trim();
    }
    if (Array.isArray(forwarded) && forwarded[0]) {
        return forwarded[0].split(",")[0]?.trim();
    }
    if (headers.referer) {
        try {
            return new URL(headers.referer).host;
        }
        catch {
            /* ignore */
        }
    }
    if (headers.host?.trim()) {
        return headers.host.trim();
    }
    return undefined;
}
