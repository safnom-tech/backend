import Redis from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { MemoryTemplateCache } from "./memory-template-cache.js";
import { RedisTemplateCache } from "./redis-template-cache.js";
import type { TemplateCache } from "./template-cache.types.js";

let cache: TemplateCache | null = null;
let redisClient: Redis | null = null;

export function getTemplateCache(): TemplateCache {
  if (cache) return cache;
  cache = new MemoryTemplateCache();
  return cache;
}

export async function connectTemplateCache(): Promise<void> {
  if (!env.redisUrl) {
    logger.info("REDIS_URL not set — template cache uses in-memory store");
    cache = new MemoryTemplateCache();
    return;
  }

  try {
    const client = new Redis(env.redisUrl, { maxRetriesPerRequest: 2 });
    await client.ping();
    redisClient = client;
    cache = new RedisTemplateCache(client);
    logger.info("Template cache connected to Redis");
  } catch (error) {
    logger.warn(
      { err: error },
      "Redis unavailable — falling back to in-memory template cache"
    );
    if (redisClient) {
      redisClient.disconnect();
      redisClient = null;
    }
    cache = new MemoryTemplateCache();
  }
}

export async function disconnectTemplateCache(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  cache = null;
}

export function resetTemplateCacheForTests(): void {
  const current = cache;
  if (current instanceof MemoryTemplateCache) {
    current.clearForTests();
  }
  cache = null;
}
