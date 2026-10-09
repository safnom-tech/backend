"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWebsiteSummary = buildWebsiteSummary;
exports.buildDesignSystemContext = buildDesignSystemContext;
exports.summarizePageSections = summarizePageSections;
function buildWebsiteSummary(website, businessContext) {
    return {
        name: businessContext?.businessName ?? website.name,
        description: businessContext?.businessDescription ?? website.description ?? undefined,
        category: businessContext?.businessType ?? undefined,
        location: businessContext?.location ?? undefined,
        services: businessContext?.services ?? undefined,
        slug: website.slug,
    };
}
function buildDesignSystemContext(website) {
    const theme = website.theme ?? {};
    return {
        colors: theme.colors ?? {},
        typography: theme.typography ?? {},
        buttons: theme.buttons ?? {},
        containerWidth: "max-w-6xl",
        spacingScale: ["compact", "medium", "large"],
        borderRadius: theme.buttons?.style === "pill" ? "large" : "medium",
    };
}
function summarizePageSections(page) {
    return page.sections
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
        type: s.type,
        order: s.order,
        heading: typeof s.data?.heading === "string"
            ? String(s.data.heading).slice(0, 120)
            : typeof s.data?.title === "string"
                ? String(s.data.title).slice(0, 120)
                : undefined,
        variant: typeof s.settings?.variant === "string" ? s.settings.variant : undefined,
    }));
}
