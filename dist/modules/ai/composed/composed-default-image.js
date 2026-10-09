"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COMPOSED_SECTION_IMAGE_URL = void 0;
exports.applyDefaultComposedImages = applyDefaultComposedImages;
/** Single stock photo for all composed section image slots (saves AI image work). */
exports.DEFAULT_COMPOSED_SECTION_IMAGE_URL = "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80";
function walkNode(node) {
    const props = node.props ?? {};
    if (node.type === "image" || node.type === "avatar") {
        const url = typeof props.url === "string" ? props.url.trim() : "";
        node.props = {
            ...props,
            url: url || exports.DEFAULT_COMPOSED_SECTION_IMAGE_URL,
        };
        if (node.props && "intent" in node.props) {
            delete node.props.intent;
        }
    }
    if (node.type === "gallery" && Array.isArray(props.images)) {
        node.props = {
            ...props,
            images: props.images.map((img) => {
                const u = typeof img.url === "string" ? img.url.trim() : "";
                const next = {
                    ...img,
                    url: u || exports.DEFAULT_COMPOSED_SECTION_IMAGE_URL,
                };
                delete next.intent;
                return next;
            }),
        };
    }
    if (node.type === "carousel" && Array.isArray(props.slides)) {
        node.props = {
            ...props,
            slides: props.slides.map((slide) => {
                const u = typeof slide.imageUrl === "string" ? slide.imageUrl.trim() : "";
                return {
                    ...slide,
                    imageUrl: u || exports.DEFAULT_COMPOSED_SECTION_IMAGE_URL,
                };
            }),
        };
    }
    for (const child of node.children ?? []) {
        walkNode(child);
    }
}
function applyDefaultComposedImages(section) {
    const clone = JSON.parse(JSON.stringify(section));
    walkNode(clone.root);
    return clone;
}
