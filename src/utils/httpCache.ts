import type { Response } from "express";

/** Short private cache for authenticated catalog reads (per-user browser cache). */
export function setPrivateHttpCache(res: Response, maxAgeSeconds: number): void {
  res.setHeader("Cache-Control", `private, max-age=${maxAgeSeconds}`);
}
