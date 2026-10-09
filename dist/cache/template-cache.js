"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplateCache = getTemplateCache;
exports.connectTemplateCache = connectTemplateCache;
exports.disconnectTemplateCache = disconnectTemplateCache;
exports.resetTemplateCacheForTests = resetTemplateCacheForTests;
const ioredis_1 = __importDefault(require("ioredis"));
const env_js_1 = require("../config/env.js");
const logger_js_1 = require("../utils/logger.js");
const memory_template_cache_js_1 = require("./memory-template-cache.js");
const redis_template_cache_js_1 = require("./redis-template-cache.js");
let cache = null;
let redisClient = null;
function getTemplateCache() {
    if (cache)
        return cache;
    cache = new memory_template_cache_js_1.MemoryTemplateCache();
    return cache;
}
async function connectTemplateCache() {
    if (!env_js_1.env.redisUrl) {
        logger_js_1.logger.info("REDIS_URL not set — template cache uses in-memory store");
        cache = new memory_template_cache_js_1.MemoryTemplateCache();
        return;
    }
    try {
        const client = new ioredis_1.default(env_js_1.env.redisUrl, { maxRetriesPerRequest: 2 });
        await client.ping();
        redisClient = client;
        cache = new redis_template_cache_js_1.RedisTemplateCache(client);
        logger_js_1.logger.info("Template cache connected to Redis");
    }
    catch (error) {
        logger_js_1.logger.warn({ err: error }, "Redis unavailable — falling back to in-memory template cache");
        if (redisClient) {
            redisClient.disconnect();
            redisClient = null;
        }
        cache = new memory_template_cache_js_1.MemoryTemplateCache();
    }
}
async function disconnectTemplateCache() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
    cache = null;
}
function resetTemplateCacheForTests() {
    const current = cache;
    if (current instanceof memory_template_cache_js_1.MemoryTemplateCache) {
        current.clearForTests();
    }
    cache = null;
}
