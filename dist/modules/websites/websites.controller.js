"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.websitesController = void 0;
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const templates_service_js_1 = require("../templates/templates.service.js");
const websitesService = __importStar(require("./websites.service.js"));
function requireWorkspaceId(req) {
    const workspaceId = String(req.params.workspaceId ?? "");
    if (!workspaceId) {
        throw new error_middleware_js_1.AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
    }
    return workspaceId;
}
exports.websitesController = {
    create: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const { templateId, ...createInput } = req.body;
            let website = await websitesService.createWebsite(workspaceId, createInput);
            if (templateId) {
                website = await (0, templates_service_js_1.applyTemplateToWebsite)(workspaceId, website.id, templateId);
            }
            (0, apiResponse_js_1.sendSuccess)(res, "Website created successfully", website, 201);
        }
        catch (error) {
            next(error);
        }
    },
    list: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const websites = await websitesService.listWebsitesForWorkspace(workspaceId);
            (0, apiResponse_js_1.sendSuccess)(res, "Websites retrieved successfully", { websites });
        }
        catch (error) {
            next(error);
        }
    },
    getOne: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const website = await websitesService.getWebsite(workspaceId, String(req.params.websiteId));
            (0, apiResponse_js_1.sendSuccess)(res, "Website retrieved successfully", website);
        }
        catch (error) {
            next(error);
        }
    },
    update: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const website = await websitesService.updateWebsite(workspaceId, String(req.params.websiteId), req.body);
            (0, apiResponse_js_1.sendSuccess)(res, "Website updated successfully", website);
        }
        catch (error) {
            next(error);
        }
    },
    delete: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            await websitesService.deleteWebsite(workspaceId, String(req.params.websiteId));
            (0, apiResponse_js_1.sendSuccess)(res, "Website deleted successfully", null);
        }
        catch (error) {
            next(error);
        }
    },
};
