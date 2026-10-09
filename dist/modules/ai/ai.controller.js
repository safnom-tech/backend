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
exports.aiController = void 0;
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const fieldContentService = __importStar(require("./content/field-content.service.js"));
const composedSectionService = __importStar(require("./composed/composed-section.service.js"));
const aiService = __importStar(require("./ai.service.js"));
function requireWorkspaceId(req) {
    const workspaceId = String(req.params.workspaceId ?? "");
    if (!workspaceId) {
        throw new error_middleware_js_1.AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
    }
    return workspaceId;
}
exports.aiController = {
    generateWebsite: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const result = await aiService.generateWebsiteFromAi(workspaceId, req.body);
            (0, apiResponse_js_1.sendSuccess)(res, "AI website generated successfully", result, 201);
        }
        catch (error) {
            next(error);
        }
    },
    generateFieldContent: async (req, res, next) => {
        try {
            requireWorkspaceId(req);
            const result = await fieldContentService.generateFieldContent(req.body);
            (0, apiResponse_js_1.sendSuccess)(res, "AI content generated successfully", result);
        }
        catch (error) {
            next(error);
        }
    },
    generateComposedSection: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const result = await composedSectionService.generateComposedSection(workspaceId, req.body);
            (0, apiResponse_js_1.sendSuccess)(res, "AI section generated successfully", result);
        }
        catch (error) {
            next(error);
        }
    },
    regenerateComposedSection: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const result = await composedSectionService.regenerateComposedSection(workspaceId, req.body);
            (0, apiResponse_js_1.sendSuccess)(res, "AI section regenerated successfully", result);
        }
        catch (error) {
            next(error);
        }
    },
    editComposedSection: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const result = await composedSectionService.editComposedSection(workspaceId, req.body);
            (0, apiResponse_js_1.sendSuccess)(res, "AI section updated successfully", result);
        }
        catch (error) {
            next(error);
        }
    },
    sectionAction: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const result = await aiService.runSectionAction(workspaceId, req.body);
            (0, apiResponse_js_1.sendSuccess)(res, "AI suggestion generated successfully", result);
        }
        catch (error) {
            next(error);
        }
    },
};
