"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePlatformDomainForHost = resolvePlatformDomainForHost;
exports.buildPublicSiteUrl = buildPublicSiteUrl;
exports.resolveRequestHostFromHeaders = resolveRequestHostFromHeaders;
exports.validateSubdomainFormat = validateSubdomainFormat;
exports.validateSubdomainForWebsite = validateSubdomainForWebsite;
exports.buildSnapshot = buildSnapshot;
exports.getPublishingState = getPublishingState;
exports.updateSubdomain = updateSubdomain;
exports.publishWebsite = publishWebsite;
exports.unpublishWebsite = unpublishWebsite;
exports.getPublicSiteBySubdomain = getPublicSiteBySubdomain;
const mongoose_1 = require("mongoose");
const env_js_1 = require("../../config/env.js");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const slugify_js_1 = require("../../utils/slugify.js");
const pages_service_js_1 = require("../pages/pages.service.js");
const websites_model_js_1 = require("../websites/websites.model.js");
const websites_service_js_1 = require("../websites/websites.service.js");
const platform_domain_js_1 = require("./platform-domain.js");
const reserved_subdomains_js_1 = require("./reserved-subdomains.js");
function normalizeSubdomainInput(raw) {
    return raw.trim().toLowerCase();
}
function defaultPlatformDomain() {
    return env_js_1.env.publishPlatformDomains[0] ?? "safnom.site";
}
function resolvePlatformDomainForHost(requestHost) {
    if (requestHost) {
        const fromHost = (0, platform_domain_js_1.resolvePlatformBaseDomain)(requestHost, env_js_1.env.publishPlatformDomains);
        if (fromHost)
            return fromHost;
    }
    return defaultPlatformDomain();
}
function buildPublicSiteUrl(subdomain, platformDomain, requestHost) {
    const platform = platformDomain?.trim().toLowerCase() ||
        resolvePlatformDomainForHost(requestHost);
    try {
        const origin = env_js_1.env.publishPublicOrigin.replace(/\/$/, "");
        const url = new URL(origin);
        return (0, platform_domain_js_1.buildTenantSiteUrl)(subdomain, platform, {
            protocol: url.protocol.replace(/:$/, ""),
            port: url.port || undefined,
        });
    }
    catch {
        return (0, platform_domain_js_1.buildTenantSiteUrl)(subdomain, platform);
    }
}
function resolveRequestHostFromHeaders(headers) {
    return (0, platform_domain_js_1.hostFromRequestHeaders)(headers);
}
async function assertSubdomainAvailable(subdomain, excludeWebsiteId) {
    const filter = { subdomain };
    if (excludeWebsiteId && mongoose_1.Types.ObjectId.isValid(excludeWebsiteId)) {
        filter._id = { $ne: new mongoose_1.Types.ObjectId(excludeWebsiteId) };
    }
    const taken = await websites_model_js_1.WebsiteModel.exists(filter);
    if (taken) {
        throw new error_middleware_js_1.AppError("This subdomain is already in use", 409, "SUBDOMAIN_TAKEN");
    }
}
function validateSubdomainFormat(subdomain) {
    const normalized = normalizeSubdomainInput(subdomain);
    if (!(0, slugify_js_1.isValidSlug)(normalized)) {
        throw new error_middleware_js_1.AppError("Invalid or unavailable website", 400, "SUBDOMAIN_INVALID");
    }
    if ((0, reserved_subdomains_js_1.isReservedSubdomain)(normalized)) {
        throw new error_middleware_js_1.AppError("This subdomain is reserved", 400, "SUBDOMAIN_RESERVED");
    }
    return normalized;
}
async function validateSubdomainForWebsite(subdomain, excludeWebsiteId) {
    const normalized = validateSubdomainFormat(subdomain);
    await assertSubdomainAvailable(normalized, excludeWebsiteId);
    return normalized;
}
function pageToSnapshotPage(page) {
    return {
        slug: page.slug,
        name: page.name,
        pageType: page.pageType,
        status: page.status,
        seo: {
            title: page.seo.title,
            metaDescription: page.seo.metaDescription,
            socialImage: page.seo.socialImage,
        },
        sections: page.sections.map((s) => ({
            id: s.id,
            type: s.type,
            order: s.order,
            data: s.data,
            settings: s.settings,
        })),
    };
}
async function buildSnapshot(workspaceId, websiteId, nextVersion) {
    const website = await (0, websites_service_js_1.assertWebsiteInWorkspace)(workspaceId, websiteId);
    const pages = await (0, pages_service_js_1.listPagesForWebsite)(workspaceId, websiteId);
    const publishable = pages.filter((p) => p.status !== "UNPUBLISHED");
    if (publishable.length === 0) {
        throw new error_middleware_js_1.AppError("Add at least one page before publishing", 400, "WEBSITE_NOT_PUBLISHABLE");
    }
    return {
        version: nextVersion,
        website: {
            name: website.name,
            description: website.description,
            theme: website.theme,
            settings: website.settings,
        },
        pages: publishable.map(pageToSnapshotPage),
    };
}
function pickPageFromSnapshot(snapshot, pageSlug) {
    const pages = snapshot.pages;
    if (pages.length === 0) {
        throw new error_middleware_js_1.AppError("Page not found", 404, "PAGE_NOT_FOUND");
    }
    const requested = pageSlug?.trim().toLowerCase();
    let match;
    if (requested) {
        match = pages.find((p) => p.slug === requested);
        if (!match) {
            throw new error_middleware_js_1.AppError("Page not found", 404, "PAGE_NOT_FOUND");
        }
    }
    else {
        match =
            pages.find((p) => p.pageType === "HOME") ??
                pages.find((p) => p.slug === "home") ??
                pages[0];
    }
    return {
        slug: match.slug,
        name: match.name,
        pageType: match.pageType,
        seo: {
            title: match.seo.title ?? null,
            metaDescription: match.seo.metaDescription ?? null,
            socialImage: match.seo.socialImage ?? null,
        },
        sections: match.sections,
    };
}
function toPageSummaries(snapshot) {
    return snapshot.pages.map((p) => ({
        slug: p.slug,
        name: p.name,
        pageType: p.pageType,
        seo: {
            title: p.seo.title ?? null,
            metaDescription: p.seo.metaDescription ?? null,
            socialImage: p.seo.socialImage ?? null,
        },
    }));
}
async function getPublishingState(workspaceId, websiteId, requestHost) {
    await (0, websites_service_js_1.assertWebsiteInWorkspace)(workspaceId, websiteId);
    const doc = await websites_model_js_1.WebsiteModel.findOne({
        _id: new mongoose_1.Types.ObjectId(websiteId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    });
    if (!doc) {
        throw new error_middleware_js_1.AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
    }
    const hasUnpublishedChanges = await (0, websites_service_js_1.computeHasUnpublishedChanges)(doc);
    const subdomain = doc.subdomain ?? null;
    const platformDomain = doc.platformDomain ??
        resolvePlatformDomainForHost(requestHost);
    return {
        websiteId: doc._id.toString(),
        status: doc.status,
        subdomain,
        platformDomain,
        publishedAt: doc.publishedAt ?? null,
        publishedVersion: doc.publishedVersion ?? 0,
        hasUnpublishedChanges,
        publicUrl: doc.status === "PUBLISHED" && subdomain
            ? buildPublicSiteUrl(subdomain, doc.platformDomain, requestHost)
            : null,
    };
}
async function updateSubdomain(workspaceId, websiteId, subdomain, requestHost) {
    await (0, websites_service_js_1.assertWebsiteInWorkspace)(workspaceId, websiteId);
    const normalized = await validateSubdomainForWebsite(subdomain, websiteId);
    const website = await websites_model_js_1.WebsiteModel.findOneAndUpdate({
        _id: new mongoose_1.Types.ObjectId(websiteId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    }, { subdomain: normalized }, { new: true });
    if (!website) {
        throw new error_middleware_js_1.AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
    }
    return getPublishingState(workspaceId, websiteId, requestHost);
}
async function publishWebsite(workspaceId, websiteId, input) {
    const publicWebsite = await (0, websites_service_js_1.assertWebsiteInWorkspace)(workspaceId, websiteId);
    const doc = await websites_model_js_1.WebsiteModel.findOne({
        _id: new mongoose_1.Types.ObjectId(websiteId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    });
    if (!doc) {
        throw new error_middleware_js_1.AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
    }
    let subdomain = doc.subdomain ?? null;
    if (input?.subdomain?.trim()) {
        subdomain = await validateSubdomainForWebsite(input.subdomain, websiteId);
    }
    else if (!subdomain) {
        subdomain = await validateSubdomainForWebsite(publicWebsite.slug, websiteId);
    }
    else {
        await validateSubdomainForWebsite(subdomain, websiteId);
    }
    const nextVersion = (doc.publishedVersion ?? 0) + 1;
    const snapshot = await buildSnapshot(workspaceId, websiteId, nextVersion);
    const now = new Date();
    const platformDomain = resolvePlatformDomainForHost(input?.requestHost);
    const updated = await websites_model_js_1.WebsiteModel.findOneAndUpdate({
        _id: new mongoose_1.Types.ObjectId(websiteId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    }, {
        subdomain,
        platformDomain,
        status: "PUBLISHED",
        publishedAt: now,
        publishedVersion: nextVersion,
        publishedSnapshot: snapshot,
    }, { new: true });
    if (!updated) {
        throw new error_middleware_js_1.AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
    }
    return getPublishingState(workspaceId, websiteId, input?.requestHost);
}
async function unpublishWebsite(workspaceId, websiteId, requestHost) {
    await (0, websites_service_js_1.assertWebsiteInWorkspace)(workspaceId, websiteId);
    const updated = await websites_model_js_1.WebsiteModel.findOneAndUpdate({
        _id: new mongoose_1.Types.ObjectId(websiteId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    }, { status: "UNPUBLISHED" }, { new: true });
    if (!updated) {
        throw new error_middleware_js_1.AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
    }
    return getPublishingState(workspaceId, websiteId, requestHost);
}
async function getPublicSiteBySubdomain(subdomain, pageSlug) {
    const normalized = normalizeSubdomainInput(subdomain);
    if (!(0, slugify_js_1.isValidSlug)(normalized) || (0, reserved_subdomains_js_1.isReservedSubdomain)(normalized)) {
        throw new error_middleware_js_1.AppError("Invalid or unavailable website", 404, "WEBSITE_NOT_FOUND");
    }
    const website = await websites_model_js_1.WebsiteModel.findOne({
        subdomain: normalized,
        status: "PUBLISHED",
    }).lean();
    if (!website?.publishedSnapshot) {
        throw new error_middleware_js_1.AppError("This website is not currently published", 404, "WEBSITE_NOT_PUBLISHED");
    }
    const snapshot = website.publishedSnapshot;
    const page = pickPageFromSnapshot(snapshot, pageSlug);
    return {
        website: {
            publicId: website.publicId ?? "",
            name: snapshot.website.name,
            description: snapshot.website.description,
            theme: snapshot.website.theme,
        },
        pages: toPageSummaries(snapshot),
        page,
    };
}
