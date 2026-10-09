"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisTemplateCache = void 0;
class RedisTemplateCache {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    async get(key) {
        return this.redis.get(key);
    }
    async set(key, value, ttlSeconds) {
        await this.redis.set(key, value, "EX", ttlSeconds);
    }
    async del(key) {
        await this.redis.del(key);
    }
    async delByPrefix(prefix) {
        let cursor = "0";
        do {
            const [next, keys] = await this.redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
            cursor = next;
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } while (cursor !== "0");
    }
}
exports.RedisTemplateCache = RedisTemplateCache;
