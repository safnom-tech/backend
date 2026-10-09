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
exports.templatesController = void 0;
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const httpCache_js_1 = require("../../utils/httpCache.js");
const templatesService = __importStar(require("./templates.service.js"));
exports.templatesController = {
    list: async (req, res, next) => {
        try {
            const query = req.query;
            const result = await templatesService.listTemplates(query);
            (0, httpCache_js_1.setPrivateHttpCache)(res, 120);
            (0, apiResponse_js_1.sendSuccess)(res, "Templates retrieved successfully", result);
        }
        catch (error) {
            next(error);
        }
    },
    getOne: async (req, res, next) => {
        try {
            const template = await templatesService.getTemplateById(String(req.params.templateId));
            (0, httpCache_js_1.setPrivateHttpCache)(res, 300);
            (0, apiResponse_js_1.sendSuccess)(res, "Template retrieved successfully", template);
        }
        catch (error) {
            next(error);
        }
    },
    previewForWorkspace: async (req, res, next) => {
        try {
            const payload = await templatesService.getTemplatePreviewForWorkspace(String(req.params.workspaceId), String(req.params.templateId));
            (0, httpCache_js_1.setPrivateHttpCache)(res, 60);
            (0, apiResponse_js_1.sendSuccess)(res, "Template preview retrieved successfully", payload);
        }
        catch (error) {
            next(error);
        }
    },
};
