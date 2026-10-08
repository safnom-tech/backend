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
exports.usersController = void 0;
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const usersService = __importStar(require("./users.service.js"));
exports.usersController = {
    getMe: async (req, res, next) => {
        try {
            if (!req.user) {
                next(new error_middleware_js_1.AppError("Authentication required", 401, "UNAUTHORIZED"));
                return;
            }
            const user = await usersService.getUserById(req.user.id);
            (0, apiResponse_js_1.sendSuccess)(res, "Profile retrieved", user);
        }
        catch (error) {
            next(error);
        }
    },
    updateMe: async (req, res, next) => {
        try {
            if (!req.user) {
                next(new error_middleware_js_1.AppError("Authentication required", 401, "UNAUTHORIZED"));
                return;
            }
            const user = await usersService.updateUserProfile(req.user.id, req.body);
            (0, apiResponse_js_1.sendSuccess)(res, "Profile updated", user);
        }
        catch (error) {
            next(error);
        }
    },
};
