import type {
  ComposedNodeOutput,
  ComposedSectionDefinition,
} from "./composed-section.schema.js";
import {
  buildMockComposedSectionFromPreset,
  resolveLayoutPresetId,
  type ComposedLayoutPresetId,
} from "./composed-layout.presets.js";

const TEXT_PROPS = [
  "text",
  "label",
  "title",
  "alt",
  "submitLabel",
  "caption",
  "name",
] as const;

function copyTextProps(
  target: Record<string, unknown>,
  source: Record<string, unknown>
) {
  for (const key of TEXT_PROPS) {
    const v = source[key];
    if (typeof v === "string" && v.trim()) {
      target[key] = v;
    }
  }
}

function mergeArrayField(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  key: "items" | "slides" | "images"
) {
  const srcArr = source[key];
  const tgtArr = target[key];
  if (!Array.isArray(srcArr) || !Array.isArray(tgtArr)) return;
  const out = tgtArr.map((tgtRow, i) => {
    const srcRow = srcArr[i];
    if (!srcRow || typeof srcRow !== "object") return tgtRow;
    const merged = {
      ...(typeof tgtRow === "object" && tgtRow !== null ? tgtRow : {}),
    } as Record<string, unknown>;
    const src = srcRow as Record<string, unknown>;
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

function mergeNodes(target: ComposedNodeOutput, source: ComposedNodeOutput) {
  if (target.type !== source.type) return;

  if (target.props && source.props) {
    const t = target.props as Record<string, unknown>;
    const s = source.props as Record<string, unknown>;
    copyTextProps(t, s);
    mergeArrayField(t, s, "items");
    mergeArrayField(t, s, "slides");
    mergeArrayField(t, s, "images");
  }

  const tChildren = target.children ?? [];
  const sChildren = source.children ?? [];
  for (let i = 0; i < tChildren.length && i < sChildren.length; i++) {
    mergeNodes(tChildren[i]!, sChildren[i]!);
  }
}

/** Fixed design skeleton + AI copy merged in (structure/images from preset). */
export function applyPresetDesignWithAiContent(
  layoutPresetId: string | undefined,
  prompt: string,
  aiSection: ComposedSectionDefinition
): ComposedSectionDefinition {
  const presetId = resolveLayoutPresetId(layoutPresetId, prompt);
  const skeleton = buildMockComposedSectionFromPreset(
    presetId as ComposedLayoutPresetId,
    prompt
  );
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
