import type {
  ComposedNodeOutput,
  ComposedSectionDefinition,
} from "./composed-section.schema.js";

/** Single stock photo for all composed section image slots (saves AI image work). */
export const DEFAULT_COMPOSED_SECTION_IMAGE_URL =
  "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80";

function walkNode(node: ComposedNodeOutput): void {
  const props = node.props ?? {};

  if (node.type === "image" || node.type === "avatar") {
    const url = typeof props.url === "string" ? props.url.trim() : "";
    node.props = {
      ...props,
      url: url || DEFAULT_COMPOSED_SECTION_IMAGE_URL,
    };
    if (node.props && "intent" in node.props) {
      delete (node.props as Record<string, unknown>).intent;
    }
  }

  if (node.type === "gallery" && Array.isArray(props.images)) {
    node.props = {
      ...props,
      images: (props.images as Record<string, unknown>[]).map((img) => {
        const u = typeof img.url === "string" ? img.url.trim() : "";
        const next: Record<string, unknown> = {
          ...img,
          url: u || DEFAULT_COMPOSED_SECTION_IMAGE_URL,
        };
        delete next.intent;
        return next;
      }),
    };
  }

  if (node.type === "carousel" && Array.isArray(props.slides)) {
    node.props = {
      ...props,
      slides: (props.slides as Record<string, unknown>[]).map((slide) => {
        const u =
          typeof slide.imageUrl === "string" ? slide.imageUrl.trim() : "";
        return {
          ...slide,
          imageUrl: u || DEFAULT_COMPOSED_SECTION_IMAGE_URL,
        };
      }),
    };
  }

  for (const child of node.children ?? []) {
    walkNode(child);
  }
}

export function applyDefaultComposedImages(
  section: ComposedSectionDefinition
): ComposedSectionDefinition {
  const clone = JSON.parse(
    JSON.stringify(section)
  ) as ComposedSectionDefinition;
  walkNode(clone.root);
  return clone;
}
