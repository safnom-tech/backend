"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryTemplateCache = void 0;
class MemoryTemplateCache {
    store = new Map();
    async get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttlSeconds) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }
    async del(key) {
        this.store.delete(key);
    }
    async delByPrefix(prefix) {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }
    clearForTests() {
        this.store.clear();
    }
}
exports.MemoryTemplateCache = MemoryTemplateCache;
