"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLayoutPresetId = exports.buildMockComposedSectionFromPreset = exports.buildMockComposedSection = void 0;
exports.editMockComposedSection = editMockComposedSection;
exports.regenerateMockComposedSection = regenerateMockComposedSection;
const composed_layout_presets_js_1 = require("./composed-layout.presets.js");
var composed_layout_presets_js_2 = require("./composed-layout.presets.js");
Object.defineProperty(exports, "buildMockComposedSection", { enumerable: true, get: function () { return composed_layout_presets_js_2.buildMockComposedSection; } });
Object.defineProperty(exports, "buildMockComposedSectionFromPreset", { enumerable: true, get: function () { return composed_layout_presets_js_2.buildMockComposedSectionFromPreset; } });
Object.defineProperty(exports, "resolveLayoutPresetId", { enumerable: true, get: function () { return composed_layout_presets_js_2.resolveLayoutPresetId; } });
function cloneSection(section) {
    return JSON.parse(JSON.stringify(section));
}
function parseRemovalFlags(prompt) {
    const lower = prompt.toLowerCase();
    const wantsEdit = /\b(rm|remove|delete|drop|clear|hide|strip|no)\b/.test(lower) ||
        lower.includes("without");
    if (!wantsEdit) {
        return { removeBadge: false, removeTitle: false, removeDescription: false };
    }
    const topBlock = lower.includes("top section") ||
        lower.includes("top part") ||
        lower.includes("intro");
    const removeBadge = topBlock || lower.includes("eyebrow") || lower.includes("badge");
    const removeTitle = topBlock || lower.includes("title") || lower.includes("heading");
    const removeDescription = topBlock ||
        lower.includes("description") ||
        lower.includes("short description") ||
        lower.includes("subtitle") ||
        lower.includes("blurb");
    return { removeBadge, removeTitle, removeDescription };
}
function filterTree(node, flags, state) {
    if (flags.removeBadge && node.type === "badge")
        return null;
    if (flags.removeTitle && node.type === "heading")
        return null;
    if (flags.removeDescription && node.type === "text" && !state.textRemoved) {
        state.textRemoved = true;
        return null;
    }
    if (!node.children?.length) {
        return { ...node };
    }
    const children = node.children
        .map((child) => filterTree(child, flags, state))
        .filter((c) => c !== null);
    return {
        ...node,
        children: children.length ? children : undefined,
    };
}
/** Apply prompt-driven edits to an existing composed section (mock / dev). */
function editMockComposedSection(current, prompt, layoutPresetId) {
    const preset = layoutPresetId
        ? (0, composed_layout_presets_js_1.resolveLayoutPresetId)(layoutPresetId, prompt)
        : null;
    const layoutChanged = preset != null && current.layout !== preset && layoutPresetId != null;
    let next = layoutChanged
        ? (0, composed_layout_presets_js_1.buildMockComposedSectionFromPreset)(preset, prompt)
        : cloneSection(current);
    const flags = parseRemovalFlags(prompt);
    const anyRemove = flags.removeBadge || flags.removeTitle || flags.removeDescription;
    next.content = { ...(next.content ?? {}) };
    if (flags.removeBadge)
        next.content.eyebrow = "";
    if (flags.removeTitle)
        next.content.title = "";
    if (flags.removeDescription)
        next.content.description = "";
    if (anyRemove && next.root) {
        const filtered = filterTree(next.root, flags, { textRemoved: false });
        if (filtered)
            next.root = filtered;
    }
    if (!anyRemove && !layoutChanged) {
        const note = prompt.trim().slice(0, 80);
        if (note) {
            next.content.description = [next.content.description, note].filter(Boolean).join(" — ");
        }
    }
    return next;
}
function regenerateMockComposedSection(prompt, layoutPresetId, _current) {
    const preset = (0, composed_layout_presets_js_1.resolveLayoutPresetId)(layoutPresetId, prompt);
    return (0, composed_layout_presets_js_1.buildMockComposedSectionFromPreset)(preset, prompt);
}
