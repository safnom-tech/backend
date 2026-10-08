import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyBusinessProfileToSeedPages } from "./apply-business-profile.js";

describe("applyBusinessProfileToSeedPages", () => {
  it("injects business details into header and footer sections", () => {
    const pages = [
      {
        name: "Home",
        slug: "home",
        pageType: "HOME" as const,
        sections: [
          {
            type: "HEADER" as const,
            order: 0,
            data: { logoText: "Template Co", phone: "+1 000" },
            settings: {},
          },
          {
            type: "FOOTER" as const,
            order: 1,
            data: { logoText: "Template Co", social: "Old" },
            settings: {},
          },
        ],
      },
    ];

    const result = applyBusinessProfileToSeedPages(pages, {
      businessName: "Acme Logistics",
      tagline: "We ship worldwide",
      phone: "+971 555 1234",
      socialInstagram: "https://instagram.com/acme",
      socialFacebook: "https://facebook.com/acme",
    });

    const header = result[0]!.sections[0]!.data;
    const footer = result[0]!.sections[1]!.data;
    assert.equal(header.logoText, "Acme Logistics");
    assert.equal(header.logoSub, "We ship worldwide");
    assert.equal(header.phone, "+971 555 1234");
    assert.equal(footer.logoText, "Acme Logistics");
    assert.match(String(footer.social), /Instagram/);
    assert.match(String(footer.copyright), /Acme Logistics/);
  });

  it("removes footer social when profile has no social URLs", () => {
    const pages = [
      {
        name: "Home",
        slug: "home",
        pageType: "HOME" as const,
        sections: [
          {
            type: "FOOTER" as const,
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

    const result = applyBusinessProfileToSeedPages(pages, {
      businessName: "Acme Logistics",
    });

    const footer = result[0]!.sections[0]!.data;
    assert.equal(footer.social, undefined);
  });
});
