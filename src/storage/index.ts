import path from "node:path";
import { env } from "../config/env.js";
import { LocalStorageService } from "./local.storage.js";
import type { StorageService } from "./storage.types.js";

let instance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (instance) return instance;
  if (env.mediaStorageDriver !== "local") {
    throw new Error(`Unsupported MEDIA_STORAGE_DRIVER: ${env.mediaStorageDriver}`);
  }
  const root = path.isAbsolute(env.mediaLocalRoot)
    ? env.mediaLocalRoot
    : path.join(process.cwd(), env.mediaLocalRoot);
  instance = new LocalStorageService(root);
  return instance;
}

/** Test-only: reset singleton and use a custom root. */
export function setStorageServiceForTests(service: StorageService | null): void {
  instance = service;
}

export type { StorageService } from "./storage.types.js";
