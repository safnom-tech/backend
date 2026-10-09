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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaController = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const mediaService = __importStar(require("./media.service.js"));
function requireWorkspaceId(req) {
    const workspaceId = String(req.params.workspaceId ?? "");
    if (!workspaceId) {
        throw new error_middleware_js_1.AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
    }
    return workspaceId;
}
function fileFromRequest(req) {
    const file = req.file;
    if (!file) {
        throw new error_middleware_js_1.AppError("File is required", 400, "INVALID_FILE");
    }
    return {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
    };
}
exports.mediaController = {
    create: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const media = await mediaService.createMedia(workspaceId, fileFromRequest(req));
            (0, apiResponse_js_1.sendSuccess)(res, "Media uploaded successfully", media, 201);
        }
        catch (error) {
            next(error);
        }
    },
    list: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const limit = typeof req.query.limit === "string"
                ? Number(req.query.limit)
                : undefined;
            const data = await mediaService.listMedia(workspaceId, Number.isFinite(limit) ? limit : 100);
            (0, apiResponse_js_1.sendSuccess)(res, "Media listed successfully", data);
        }
        catch (error) {
            next(error);
        }
    },
    getOne: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const mediaId = String(req.params.mediaId);
            const media = await mediaService.getMedia(workspaceId, mediaId);
            (0, apiResponse_js_1.sendSuccess)(res, "Media retrieved successfully", media);
        }
        catch (error) {
            next(error);
        }
    },
    content: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const mediaId = String(req.params.mediaId);
            const { absolutePath, mimeType } = await mediaService.getMediaContent(workspaceId, mediaId);
            res.type(mimeType);
            const stream = node_fs_1.default.createReadStream(absolutePath);
            stream.on("error", (err) => next(err));
            stream.pipe(res);
        }
        catch (error) {
            next(error);
        }
    },
    replace: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const mediaId = String(req.params.mediaId);
            const media = await mediaService.replaceMedia(workspaceId, mediaId, fileFromRequest(req));
            (0, apiResponse_js_1.sendSuccess)(res, "Media replaced successfully", media);
        }
        catch (error) {
            next(error);
        }
    },
    delete: async (req, res, next) => {
        try {
            const workspaceId = requireWorkspaceId(req);
            const mediaId = String(req.params.mediaId);
            await mediaService.deleteMedia(workspaceId, mediaId);
            (0, apiResponse_js_1.sendSuccess)(res, "Media deleted successfully", { id: mediaId });
        }
        catch (error) {
            next(error);
        }
    },
};
