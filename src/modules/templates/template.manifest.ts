import { oceanCrownSummary } from "./catalog/ocean-crown.template.js";
import type { PublicTemplateSummary } from "./templates.types.js";

/**
 * Lightweight index for list/pagination — no page sections loaded.
 *
 * New theme checklist:
 * 1. Add catalog/{id}.template.ts (named template + summary exports)
 * 2. Append summary to TEMPLATE_MANIFEST
 * 3. Register dynamic import in template-loader.ts LOADERS
 * 4. Reuse section variants; add previewThumbnailUrl when CDN thumb exists
 */
export const TEMPLATE_MANIFEST: PublicTemplateSummary[] = [oceanCrownSummary];
