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
exports.workspacesController = void 0;
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const workspacesService = __importStar(require("./workspaces.service.js"));
function requireUserId(req) {
    if (!req.user?.id) {
        throw new error_middleware_js_1.AppError("Authentication required", 401, "UNAUTHORIZED");
    }
    return req.user.id;
}
exports.workspacesController = {
    create: async (req, res, next) => {
        try {
            const userId = requireUserId(req);
            const workspace = await workspacesService.createWorkspace(userId, req.body);
            (0, apiResponse_js_1.sendSuccess)(res, "Workspace created successfully", workspace, 201);
        }
        catch (error) {
            next(error);
        }
    },
    list: async (req, res, next) => {
        try {
            const userId = requireUserId(req);
            const workspaces = await workspacesService.listWorkspacesForUser(userId);
            (0, apiResponse_js_1.sendSuccess)(res, "Workspaces retrieved successfully", { workspaces });
        }
        catch (error) {
            next(error);
        }
    },
    getCurrent: async (req, res, next) => {
        try {
            const userId = requireUserId(req);
            const workspace = await workspacesService.getCurrentWorkspace(userId);
            if (!workspace) {
                (0, apiResponse_js_1.sendSuccess)(res, "No workspace selected", { workspace: null });
                return;
            }
            (0, apiResponse_js_1.sendSuccess)(res, "Current workspace retrieved successfully", {
                workspace,
            });
        }
        catch (error) {
            next(error);
        }
    },
    getOne: async (req, res, next) => {
        try {
            const userId = requireUserId(req);
            const workspace = await workspacesService.getWorkspaceForMember(userId, String(req.params.workspaceId));
            (0, apiResponse_js_1.sendSuccess)(res, "Workspace retrieved successfully", workspace);
        }
        catch (error) {
            next(error);
        }
    },
    update: async (req, res, next) => {
        try {
            const userId = requireUserId(req);
            const workspace = await workspacesService.updateWorkspaceForMember(userId, String(req.params.workspaceId), req.body);
            (0, apiResponse_js_1.sendSuccess)(res, "Workspace updated successfully", workspace);
        }
        catch (error) {
            next(error);
        }
    },
    select: async (req, res, next) => {
        try {
            const userId = requireUserId(req);
            const workspace = await workspacesService.selectWorkspace(userId, String(req.params.workspaceId));
            (0, apiResponse_js_1.sendSuccess)(res, "Workspace selected successfully", workspace);
        }
        catch (error) {
            next(error);
        }
    },
};
