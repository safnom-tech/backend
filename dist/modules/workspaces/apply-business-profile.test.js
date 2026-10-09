"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const apply_business_profile_js_1 = require("./apply-business-profile.js");
(0, node_test_1.describe)("applyBusinessProfileToSeedPages", () => {
    (0, node_test_1.it)("injects business details into header and footer sections", () => {
        const pages = [
            {
                name: "Home",
                slug: "home",
                pageType: "HOME",
                sections: [
                    {
                        type: "HEADER",
                        order: 0,
                        data: { logoText: "Template Co", phone: "+1 000" },
                        settings: {},
                    },
                    {
                        type: "FOOTER",
                        order: 1,
                        data: { logoText: "Template Co", social: "Old" },
                        settings: {},
                    },
                ],
            },
        ];
        const result = (0, apply_business_profile_js_1.applyBusinessProfileToSeedPages)(pages, {
            businessName: "Acme Logistics",
            tagline: "We ship worldwide",
            phone: "+971 555 1234",
            socialInstagram: "https://instagram.com/acme",
            socialFacebook: "https://facebook.com/acme",
        });
        const header = result[0].sections[0].data;
        const footer = result[0].sections[1].data;
        strict_1.default.equal(header.logoText, "Acme Logistics");
        strict_1.default.equal(header.logoSub, "We ship worldwide");
        strict_1.default.equal(header.phone, "+971 555 1234");
        strict_1.default.equal(footer.logoText, "Acme Logistics");
        strict_1.default.match(String(footer.social), /Instagram/);
        strict_1.default.match(String(footer.copyright), /Acme Logistics/);
    });
    (0, node_test_1.it)("removes footer social when profile has no social URLs", () => {
        const pages = [
            {
                name: "Home",
                slug: "home",
                pageType: "HOME",
                sections: [
                    {
                        type: "FOOTER",
                        order: 0,
                        data: {
                            logoText: "Template Co",
                            social: "Twitter  ·  Facebook  ·  Instagram",
                        },
                        settings: {},
                    },
                ],
            },
        ];
        const result = (0, apply_business_profile_js_1.applyBusinessProfileToSeedPages)(pages, {
            businessName: "Acme Logistics",
        });
        const footer = result[0].sections[0].data;
        strict_1.default.equal(footer.social, undefined);
    });
});
