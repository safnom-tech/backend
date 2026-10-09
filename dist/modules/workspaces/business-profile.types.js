"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyBusinessProfile = emptyBusinessProfile;
exports.normalizeBusinessProfile = normalizeBusinessProfile;
exports.businessProfileHasName = businessProfileHasName;
exports.formatSocialLine = formatSocialLine;
function emptyBusinessProfile() {
    return {};
}
function normalizeBusinessProfile(raw) {
    if (!raw || typeof raw !== "object") {
        return emptyBusinessProfile();
    }
    const o = raw;
    const str = (key) => {
        const v = o[key];
        return typeof v === "string" ? v.trim() : undefined;
    };
    return {
        businessName: str("businessName"),
        tagline: str("tagline"),
        logoUrl: str("logoUrl") ?? null,
        phone: str("phone"),
        email: str("email"),
        address: str("address"),
        socialTwitter: str("socialTwitter"),
        socialFacebook: str("socialFacebook"),
        socialInstagram: str("socialInstagram"),
        socialLinkedin: str("socialLinkedin"),
    };
}
function businessProfileHasName(profile) {
    return Boolean(profile.businessName?.trim());
}
function socialLabel(url, fallback) {
    const u = url.trim();
    if (!u)
        return "";
    try {
        const host = new URL(u.startsWith("http") ? u : `https://${u}`).hostname;
        if (host.includes("twitter") || host.includes("x.com"))
            return "Twitter";
        if (host.includes("facebook"))
            return "Facebook";
        if (host.includes("instagram"))
            return "Instagram";
        if (host.includes("linkedin"))
            return "LinkedIn";
    }
    catch {
        // ignore
    }
    return fallback;
}
/** Footer-friendly line e.g. "Twitter · Facebook · Instagram" */
function formatSocialLine(profile) {
    const parts = [];
    if (profile.socialTwitter?.trim()) {
        parts.push(socialLabel(profile.socialTwitter, "Twitter"));
    }
    if (profile.socialFacebook?.trim()) {
        parts.push(socialLabel(profile.socialFacebook, "Facebook"));
    }
    if (profile.socialInstagram?.trim()) {
        parts.push(socialLabel(profile.socialInstagram, "Instagram"));
    }
    if (profile.socialLinkedin?.trim()) {
        parts.push(socialLabel(profile.socialLinkedin, "LinkedIn"));
    }
    return parts.join("  ·  ");
}
