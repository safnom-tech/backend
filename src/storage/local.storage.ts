import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import type {
  StorageService,
  StorageUploadInput,
  StorageUploadResult,
} from "./storage.types.js";

export class LocalStorageService implements StorageService {
  constructor(private readonly rootDir: string) {}

  private resolveKey(storageKey: string): string {
    const normalized = path.normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, "");
    const full = path.join(this.rootDir, normalized);
    if (!full.startsWith(path.resolve(this.rootDir))) {
      throw new Error("Invalid storage key");
    }
    return full;
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const storageKey = `${input.workspaceId}/${input.filename}`;
    const absolute = this.resolveKey(storageKey);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, input.buffer);
    return { storageKey, filename: input.filename };
  }

  getAbsolutePath(storageKey: string): string {
    return this.resolveKey(storageKey);
  }

  getContentUrl(workspaceId: string, mediaId: string): string {
    const prefix = env.apiPrefix.replace(/\/$/, "");
    return `${prefix}/workspaces/${workspaceId}/media/${mediaId}/content`;
  }

  async delete(storageKey: string): Promise<void> {
    const absolute = this.resolveKey(storageKey);
    try {
      await fs.unlink(absolute);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw err;
    }
  }
}
