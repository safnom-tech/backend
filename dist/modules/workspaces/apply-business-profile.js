"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyBusinessProfileToSeedPages = applyBusinessProfileToSeedPages;
const business_profile_types_js_1 = require("./business-profile.types.js");
function applySectionData(type, data, profile) {
    const next = { ...data };
    const name = profile.businessName?.trim();
    if (!name)
        return next;
    switch (type) {
        case "HEADER":
            next.logoText = name;
            if (profile.tagline?.trim())
                next.logoSub = profile.tagline.trim();
            if (profile.phone?.trim())
                next.phone = profile.phone.trim();
            if (profile.logoUrl?.trim())
                next.logoUrl = profile.logoUrl.trim();
            break;
        case "FOOTER":
            next.logoText = name;
            if (profile.tagline?.trim() && !next.about) {
                next.about = profile.tagline.trim();
            }
            {
                const social = (0, business_profile_types_js_1.formatSocialLine)(profile);
                if (social) {
                    next.social = social;
                }
                else {
                    delete next.social;
                }
            }
            if (name) {
                next.copyright = `© ${name}. All rights reserved.`;
            }
            break;
        case "CONTACT":
            if (profile.email?.trim())
                next.email = profile.email.trim();
            break;
        default:
            break;
    }
    return next;
}
function applyBusinessProfileToSeedPages(pages, profile) {
    if (!(0, business_profile_types_js_1.businessProfileHasName)(profile)) {
        return pages;
    }
    const name = profile.businessName.trim();
    return pages.map((page) => ({
        ...page,
        seo: {
            ...page.seo,
            title: page.seo?.title?.replace(/^Ocean Crown[^|]*/i, name) ?? name,
        },
        sections: page.sections.map((section) => ({
            ...section,
            data: applySectionData(section.type, section.data, profile),
        })),
    }));
}
