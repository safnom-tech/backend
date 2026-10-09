"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicPublishingController = exports.publishingController = void 0;
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const publishing_service_js_1 = require("./publishing.service.js");
function paramString(value) {
    if (Array.isArray(value))
        return value[0] ?? "";
    return value ?? "";
}
function requestHost(req) {
    return (0, publishing_service_js_1.resolveRequestHostFromHeaders)({
        origin: req.headers.origin,
        referer: req.headers.referer,
        "x-forwarded-host": req.headers["x-forwarded-host"],
        host: req.headers.host,
    });
}
exports.publishingController = {
    getState: async (req, res, next) => {
        try {
            const workspaceId = paramString(req.params.workspaceId);
            const websiteId = paramString(req.params.websiteId);
            const data = await (0, publishing_service_js_1.getPublishingState)(workspaceId, websiteId, requestHost(req));
            (0, apiResponse_js_1.sendSuccess)(res, "Publishing state", data);
        }
        catch (err) {
            next(err);
        }
    },
    publish: async (req, res, next) => {
        try {
            const workspaceId = paramString(req.params.workspaceId);
            const websiteId = paramString(req.params.websiteId);
            const subdomain = typeof req.body?.subdomain === "string" ? req.body.subdomain : undefined;
            const data = await (0, publishing_service_js_1.publishWebsite)(workspaceId, websiteId, {
                subdomain,
                requestHost: requestHost(req),
            });
            (0, apiResponse_js_1.sendSuccess)(res, "Website published", data);
        }
        catch (err) {
            next(err);
        }
    },
    unpublish: async (req, res, next) => {
        try {
            const workspaceId = paramString(req.params.workspaceId);
            const websiteId = paramString(req.params.websiteId);
            const data = await (0, publishing_service_js_1.unpublishWebsite)(workspaceId, websiteId, requestHost(req));
            (0, apiResponse_js_1.sendSuccess)(res, "Website unpublished", data);
        }
        catch (err) {
            next(err);
        }
    },
    patchSubdomain: async (req, res, next) => {
        try {
            const workspaceId = paramString(req.params.workspaceId);
            const websiteId = paramString(req.params.websiteId);
            const subdomain = req.body.subdomain;
            const data = await (0, publishing_service_js_1.updateSubdomain)(workspaceId, websiteId, subdomain, requestHost(req));
            (0, apiResponse_js_1.sendSuccess)(res, "Subdomain updated", data);
        }
        catch (err) {
            next(err);
        }
    },
};
exports.publicPublishingController = {
    getSite: async (req, res, next) => {
        try {
            const subdomain = paramString(req.params.subdomain);
            const pageSlug = typeof req.query.pageSlug === "string"
                ? req.query.pageSlug
                : typeof req.query.slug === "string"
                    ? req.query.slug
                    : undefined;
            const data = await (0, publishing_service_js_1.getPublicSiteBySubdomain)(subdomain, pageSlug);
            (0, apiResponse_js_1.sendSuccess)(res, "Public site", data);
        }
        catch (err) {
            next(err);
        }
    },
};
