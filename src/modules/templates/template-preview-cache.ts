import { createHash } from "node:crypto";

export const PREVIEW_CACHE_TTL_SECONDS = 60;

export function previewCacheKey(
  workspaceId: string,
  templateId: string,
  profile: unknown
): string {
  const hash = createHash("sha256")
    .update(JSON.stringify(profile ?? {}))
    .digest("hex")
    .slice(0, 16);
  return `tpl:preview:${workspaceId}:${templateId}:${hash}`;
}
