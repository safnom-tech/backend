"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePrefixedPublicId = generatePrefixedPublicId;
const node_crypto_1 = require("node:crypto");
/** Ambiguity-safe alphabet (no 0/O, 1/I/L). */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
function randomSegment(length) {
    const bytes = (0, node_crypto_1.randomBytes)(length);
    let out = "";
    for (let i = 0; i < length; i += 1) {
        out += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return out;
}
/** Human-readable non-sequential ID, e.g. WEB-7F92LX or SAF-8K4M2P. */
function generatePrefixedPublicId(prefix, segmentLength = 6) {
    return `${prefix}-${randomSegment(segmentLength)}`;
}
