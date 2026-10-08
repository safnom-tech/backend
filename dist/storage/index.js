"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStorageService = getStorageService;
exports.setStorageServiceForTests = setStorageServiceForTests;
const node_path_1 = __importDefault(require("node:path"));
const env_js_1 = require("../config/env.js");
const local_storage_js_1 = require("./local.storage.js");
let instance = null;
function getStorageService() {
    if (instance)
        return instance;
    if (env_js_1.env.mediaStorageDriver !== "local") {
        throw new Error(`Unsupported MEDIA_STORAGE_DRIVER: ${env_js_1.env.mediaStorageDriver}`);
    }
    const root = node_path_1.default.isAbsolute(env_js_1.env.mediaLocalRoot)
        ? env_js_1.env.mediaLocalRoot
        : node_path_1.default.join(process.cwd(), env_js_1.env.mediaLocalRoot);
    instance = new local_storage_js_1.LocalStorageService(root);
    return instance;
}
/** Test-only: reset singleton and use a custom root. */
function setStorageServiceForTests(service) {
    instance = service;
}
