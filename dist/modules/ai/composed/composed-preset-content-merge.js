"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPresetDesignWithAiContent = applyPresetDesignWithAiContent;
const composed_layout_presets_js_1 = require("./composed-layout.presets.js");
const TEXT_PROPS = [
    "text",
    "label",
    "title",
    "alt",
    "submitLabel",
    "caption",
    "name",
];
function copyTextProps(target, source) {
    for (const key of TEXT_PROPS) {
        const v = source[key];
        if (typeof v === "string" && v.trim()) {
            target[key] = v;
        }
    }
}
function mergeArrayField(target, source, key) {
    const srcArr = source[key];
    const tgtArr = target[key];
    if (!Array.isArray(srcArr) || !Array.isArray(tgtArr))
        return;
    const out = tgtArr.map((tgtRow, i) => {
        const srcRow = srcArr[i];
        if (!srcRow || typeof srcRow !== "object")
            return tgtRow;
        const merged = {
            ...(typeof tgtRow === "object" && tgtRow !== null ? tgtRow : {}),
        };
        const src = srcRow;
        for (const field of ["title", "body", "label", "value", "icon", "alt"]) {
            const v = src[field];
            if (typeof v === "string" && v.trim()) {
                merged[field] = v;
            }
        }
        return merged;
    });
    target[key] = out;
}
function mergeNodes(target, source) {
    if (target.type !== source.type)
        return;
    if (target.props && source.props) {
        const t = target.props;
        const s = source.props;
        copyTextProps(t, s);
        mergeArrayField(t, s, "items");
        mergeArrayField(t, s, "slides");
        mergeArrayField(t, s, "images");
    }
    const tChildren = target.children ?? [];
    const sChildren = source.children ?? [];
    for (let i = 0; i < tChildren.length && i < sChildren.length; i++) {
        mergeNodes(tChildren[i], sChildren[i]);
    }
}
/** Fixed design skeleton + AI copy merged in (structure/images from preset). */
function applyPresetDesignWithAiContent(layoutPresetId, prompt, aiSection) {
    const presetId = (0, composed_layout_presets_js_1.resolveLayoutPresetId)(layoutPresetId, prompt);
    const skeleton = (0, composed_layout_presets_js_1.buildMockComposedSectionFromPreset)(presetId, prompt);
    mergeNodes(skeleton.root, aiSection.root);
    if (aiSection.content) {
        skeleton.content = {
            eyebrow: "",
            title: "",
            description: "",
        };
    }
    skeleton.layout = presetId;
    return skeleton;
}
