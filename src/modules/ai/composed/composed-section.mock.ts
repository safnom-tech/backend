import type {
  ComposedNodeOutput,
  ComposedSectionDefinition,
} from "./composed-section.schema.js";
import {
  buildMockComposedSectionFromPreset,
  resolveLayoutPresetId,
} from "./composed-layout.presets.js";

export {
  buildMockComposedSection,
  buildMockComposedSectionFromPreset,
  resolveLayoutPresetId,
} from "./composed-layout.presets.js";

function cloneSection(section: ComposedSectionDefinition): ComposedSectionDefinition {
  return JSON.parse(JSON.stringify(section)) as ComposedSectionDefinition;
}

function parseRemovalFlags(prompt: string): {
  removeBadge: boolean;
  removeTitle: boolean;
  removeDescription: boolean;
} {
  const lower = prompt.toLowerCase();
  const wantsEdit =
    /\b(rm|remove|delete|drop|clear|hide|strip|no)\b/.test(lower) ||
    lower.includes("without");
  if (!wantsEdit) {
    return { removeBadge: false, removeTitle: false, removeDescription: false };
  }
  const topBlock =
    lower.includes("top section") ||
    lower.includes("top part") ||
    lower.includes("intro");
  const removeBadge =
    topBlock || lower.includes("eyebrow") || lower.includes("badge");
  const removeTitle = topBlock || lower.includes("title") || lower.includes("heading");
  const removeDescription =
    topBlock ||
    lower.includes("description") ||
    lower.includes("short description") ||
    lower.includes("subtitle") ||
    lower.includes("blurb");
  return { removeBadge, removeTitle, removeDescription };
}

function filterTree(
  node: ComposedNodeOutput,
  flags: ReturnType<typeof parseRemovalFlags>,
  state: { textRemoved: boolean }
): ComposedNodeOutput | null {
  if (flags.removeBadge && node.type === "badge") return null;
  if (flags.removeTitle && node.type === "heading") return null;
  if (flags.removeDescription && node.type === "text" && !state.textRemoved) {
    state.textRemoved = true;
    return null;
  }

  if (!node.children?.length) {
    return { ...node };
  }

  const children = node.children
    .map((child) => filterTree(child, flags, state))
    .filter((c): c is ComposedNodeOutput => c !== null);

  return {
    ...node,
    children: children.length ? children : undefined,
  };
}

/** Apply prompt-driven edits to an existing composed section (mock / dev). */
export function editMockComposedSection(
  current: ComposedSectionDefinition,
  prompt: string,
  layoutPresetId?: string
): ComposedSectionDefinition {
  const preset = layoutPresetId
    ? resolveLayoutPresetId(layoutPresetId, prompt)
    : null;
  const layoutChanged =
    preset != null && current.layout !== preset && layoutPresetId != null;

  let next = layoutChanged
    ? buildMockComposedSectionFromPreset(preset, prompt)
    : cloneSection(current);

  const flags = parseRemovalFlags(prompt);
  const anyRemove = flags.removeBadge || flags.removeTitle || flags.removeDescription;

  next.content = { ...(next.content ?? {}) };

  if (flags.removeBadge) next.content.eyebrow = "";
  if (flags.removeTitle) next.content.title = "";
  if (flags.removeDescription) next.content.description = "";

  if (anyRemove && next.root) {
    const filtered = filterTree(next.root, flags, { textRemoved: false });
    if (filtered) next.root = filtered;
  }

  if (!anyRemove && !layoutChanged) {
    const note = prompt.trim().slice(0, 80);
    if (note) {
      next.content.description = [next.content.description, note].filter(Boolean).join(" — ");
    }
  }

  return next;
}

export function regenerateMockComposedSection(
  prompt: string,
  layoutPresetId?: string,
  _current?: ComposedSectionDefinition | null
): ComposedSectionDefinition {
  const preset = resolveLayoutPresetId(layoutPresetId, prompt);
  return buildMockComposedSectionFromPreset(preset, prompt);
}
