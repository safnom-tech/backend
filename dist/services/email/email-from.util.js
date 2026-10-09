"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmailFrom = normalizeEmailFrom;
exports.extractEmailAddress = extractEmailAddress;
exports.isPublicMailboxFrom = isPublicMailboxFrom;
exports.formatEmailFromForResend = formatEmailFromForResend;
exports.isValidEmailFromField = isValidEmailFromField;
exports.assertResendEmailFrom = assertResendEmailFrom;
exports.normalizeReplyTo = normalizeReplyTo;
const EMAIL_ADDRESS = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const NAMED_FROM = /^(.*?)<\s*([^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)\s*>$/;
function normalizeEmailFrom(value) {
    let v = value.trim();
    const quotePairs = [
        ['"', '"'],
        ["'", "'"],
        ["\u201c", "\u201d"],
        ["\u2018", "\u2019"],
    ];
    let changed = true;
    while (changed && v.length >= 2) {
        changed = false;
        for (const [open, close] of quotePairs) {
            if (v.startsWith(open) && v.endsWith(close)) {
                v = v.slice(open.length, -close.length).trim();
                changed = true;
            }
        }
    }
    return v;
}
function extractEmailAddress(from) {
    const normalized = normalizeEmailFrom(from);
    const named = normalized.match(NAMED_FROM);
    if (named) {
        return named[2].trim();
    }
    return normalized.trim();
}
const PUBLIC_MAILBOX_SUFFIXES = ["@gmail.com", "@googlemail.com"];
function isPublicMailboxFrom(from) {
    const address = extractEmailAddress(from).toLowerCase();
    return PUBLIC_MAILBOX_SUFFIXES.some((suffix) => address.endsWith(suffix));
}
/** Normalize to Resend-friendly `email` or `Name <email>`. */
function formatEmailFromForResend(from) {
    const normalized = normalizeEmailFrom(from);
    if (!normalized) {
        throw new Error("EMAIL_FROM is empty.");
    }
    const named = normalized.match(NAMED_FROM);
    if (named) {
        const name = named[1].trim();
        const email = named[2].trim();
        if (!EMAIL_ADDRESS.test(email)) {
            throw invalidFromError(normalized);
        }
        return name ? `${name} <${email}>` : email;
    }
    if (EMAIL_ADDRESS.test(normalized)) {
        return normalized;
    }
    throw invalidFromError(normalized);
}
function invalidFromError(received) {
    return new Error(`EMAIL_FROM must be "you@domain.com" or "Name <you@domain.com>" (quote the value in .env if it contains spaces). Received: ${JSON.stringify(received)}`);
}
function isValidEmailFromField(from) {
    try {
        formatEmailFromForResend(from);
        return true;
    }
    catch {
        return false;
    }
}
/** Resend rejects dev placeholders and non-routable TLDs with a generic format error. */
function assertResendEmailFrom(from) {
    const formatted = formatEmailFromForResend(from);
    const address = extractEmailAddress(formatted).toLowerCase();
    if (isPublicMailboxFrom(formatted)) {
        throw new Error("Gmail cannot be used as EMAIL_FROM with Resend. Set EMAIL_PROVIDER=smtp and use Gmail SMTP (smtp.gmail.com) instead.");
    }
    if (address.endsWith(".local") || address.includes("@yourdomain.com")) {
        throw new Error("EMAIL_FROM must use a real Resend sender (e.g. onboarding@resend.dev for testing, or a verified domain address).");
    }
    return formatted;
}
function normalizeReplyTo(value) {
    const email = value?.trim();
    if (!email || !EMAIL_ADDRESS.test(email)) {
        return undefined;
    }
    return email;
}
