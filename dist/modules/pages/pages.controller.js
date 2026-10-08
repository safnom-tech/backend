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
exports.pagesController = void 0;
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const pagesService = __importStar(require("./pages.service.js"));
function requireWorkspaceId(req) {
    const workspaceId = String(req.params.workspaceId ?? "");
    if (!workspaceId) {
        throw new error_middleware_js_1.AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
    }
    return workspaceId;
}
function requireWebsiteId(req) {
    return String(req.params.websiteId);
}
exports.pagesController = {
    create: async (req, res, next) => {
        try {
            const page = await pagesService.createPage(requireWorkspaceId(req), requireWebsiteId(req), req.body);
            (0, apiResponse_js_1.sendSuccess)(res, "Page created successfully", page, 201);
        }
        catch (error) {
            next(error);
        }
    },
    list: async (req, res, next) => {
        try {
            const pages = await pagesService.listPagesForWebsite(requireWorkspaceId(req), requireWebsiteId(req));
            (0, apiResponse_js_1.sendSuccess)(res, "Pages retrieved successfully", { pages });
        }
        catch (error) {
            next(error);
        }
    },
    getOne: async (req, res, next) => {
        try {
            const page = await pagesService.getPage(requireWorkspaceId(req), requireWebsiteId(req), String(req.params.pageId));
            (0, apiResponse_js_1.sendSuccess)(res, "Page retrieved successfully", page);
        }
        catch (error) {
            next(error);
        }
    },
    update: async (req, res, next) => {
        try {
            const page = await pagesService.updatePage(requireWorkspaceId(req), requireWebsiteId(req), String(req.params.pageId), req.body);
            (0, apiResponse_js_1.sendSuccess)(res, "Page updated successfully", page);
        }
        catch (error) {
            next(error);
        }
    },
    delete: async (req, res, next) => {
        try {
            await pagesService.deletePage(requireWorkspaceId(req), requireWebsiteId(req), String(req.params.pageId));
            (0, apiResponse_js_1.sendSuccess)(res, "Page deleted successfully", null);
        }
        catch (error) {
            next(error);
        }
    },
    addSection: async (req, res, next) => {
        try {
            const section = await pagesService.addSection(requireWorkspaceId(req), requireWebsiteId(req), String(req.params.pageId), req.body);
            (0, apiResponse_js_1.sendSuccess)(res, "Section added successfully", section, 201);
        }
        catch (error) {
            next(error);
        }
    },
    updateSection: async (req, res, next) => {
        try {
            const section = await pagesService.updateSection(requireWorkspaceId(req), requireWebsiteId(req), String(req.params.pageId), String(req.params.sectionId), req.body);
            (0, apiResponse_js_1.sendSuccess)(res, "Section updated successfully", section);
        }
        catch (error) {
            next(error);
        }
    },
    deleteSection: async (req, res, next) => {
        try {
            await pagesService.deleteSection(requireWorkspaceId(req), requireWebsiteId(req), String(req.params.pageId), String(req.params.sectionId));
            (0, apiResponse_js_1.sendSuccess)(res, "Section deleted successfully", null);
        }
        catch (error) {
            next(error);
        }
    },
    duplicateSection: async (req, res, next) => {
        try {
            const section = await pagesService.duplicateSection(requireWorkspaceId(req), requireWebsiteId(req), String(req.params.pageId), String(req.params.sectionId));
            (0, apiResponse_js_1.sendSuccess)(res, "Section duplicated successfully", section, 201);
        }
        catch (error) {
            next(error);
        }
    },
    reorderSections: async (req, res, next) => {
        try {
            const sections = await pagesService.reorderSections(requireWorkspaceId(req), requireWebsiteId(req), String(req.params.pageId), req.body.sectionIds);
            (0, apiResponse_js_1.sendSuccess)(res, "Sections reordered successfully", { sections });
        }
        catch (error) {
            next(error);
        }
    },
};
