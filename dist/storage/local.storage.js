"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageService = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const env_js_1 = require("../config/env.js");
class LocalStorageService {
    rootDir;
    constructor(rootDir) {
        this.rootDir = rootDir;
    }
    resolveKey(storageKey) {
        const normalized = node_path_1.default.normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, "");
        const full = node_path_1.default.join(this.rootDir, normalized);
        if (!full.startsWith(node_path_1.default.resolve(this.rootDir))) {
            throw new Error("Invalid storage key");
        }
        return full;
    }
    async upload(input) {
        const storageKey = `${input.workspaceId}/${input.filename}`;
        const absolute = this.resolveKey(storageKey);
        await promises_1.default.mkdir(node_path_1.default.dirname(absolute), { recursive: true });
        await promises_1.default.writeFile(absolute, input.buffer);
        return { storageKey, filename: input.filename };
    }
    getAbsolutePath(storageKey) {
        return this.resolveKey(storageKey);
    }
    getContentUrl(workspaceId, mediaId) {
        const prefix = env_js_1.env.apiPrefix.replace(/\/$/, "");
        return `${prefix}/workspaces/${workspaceId}/media/${mediaId}/content`;
    }
    async delete(storageKey) {
        const absolute = this.resolveKey(storageKey);
        try {
            await promises_1.default.unlink(absolute);
        }
        catch (err) {
            const code = err.code;
            if (code !== "ENOENT")
                throw err;
        }
    }
}
exports.LocalStorageService = LocalStorageService;
