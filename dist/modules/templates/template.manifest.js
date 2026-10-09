"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEMPLATE_MANIFEST = void 0;
const ocean_crown_template_js_1 = require("./catalog/ocean-crown.template.js");
/**
 * Lightweight index for list/pagination — no page sections loaded.
 *
 * New theme checklist:
 * 1. Add catalog/{id}.template.ts (named template + summary exports)
 * 2. Append summary to TEMPLATE_MANIFEST
 * 3. Register dynamic import in template-loader.ts LOADERS
 * 4. Reuse section variants; add previewThumbnailUrl when CDN thumb exists
 */
exports.TEMPLATE_MANIFEST = [ocean_crown_template_js_1.oceanCrownSummary];
