/** Mock / fallback: turn a design brief into marketing copy (never paste the raw prompt). */
export function synthesizeHeroFromPrompt(
  prompt: string,
  ctx: { businessName?: string; businessType?: string } = {}
): {
  data: Record<string, unknown>;
  settings: Record<string, unknown>;
} {
  const p = prompt.toLowerCase();
  const wantsSplit =
    /2-column|two column|split|banner image|hero image|image right|content left|saas|premium|modern/.test(
      p
    );
  const wantsSecondary = /secondary|two cta|two button|primary & secondary/.test(p);
  const name = ctx.businessName?.trim() || "Your brand";
  const typeHint = ctx.businessType?.trim();

  let title = "Grow faster with clarity and confidence";
  if (/banner|hero/.test(p) && typeHint) {
    title = `${typeHint} built for modern teams`;
  } else if (typeHint) {
    title = `The ${typeHint} experience customers expect`;
  } else if (name !== "Your brand") {
    title = `${name} — professional results, simply delivered`;
  }

  let description =
    "A clean, balanced layout with room to breathe. Lead with value, support with proof, and guide visitors with clear next steps.";
  if (/minimal|whitespace|clean/.test(p)) {
    description =
      "Minimal, premium, and easy to customize. Polished typography and generous spacing keep your message focused.";
  }

  return {
    data: {
      title: title.slice(0, 200),
      description: description.slice(0, 2000),
      buttonText: "Get started",
      buttonUrl: "#contact",
      ...(wantsSecondary
        ? {
            secondaryButtonText: "Learn more",
            secondaryButtonUrl: "#about",
          }
        : {}),
      imageUrl: "",
      imageAlt: wantsSplit ? "Product or team highlight" : "",
    },
    settings: {
      alignment: wantsSplit ? "left" : "center",
      paddingY: "lg",
      layout: wantsSplit ? "split" : "center",
      imagePosition: /image left|content right/.test(p) ? "left" : "right",
      imageRadius: /rounded|radius|16|24/.test(p) ? "lg" : "md",
      fontSize: "lg",
      fontWeight: "bold",
    },
  };
}

export function inferCreateSectionType(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/faq|question/.test(p)) return "FAQ";
  if (/testimonial|review|quote/.test(p)) return "TESTIMONIALS";
  if (/pricing|price|plan/.test(p)) return "PRICING";
  if (/gallery|photos/.test(p)) return "GALLERY";
  if (/contact|email/.test(p)) return "CONTACT";
  if (/service|offer/.test(p)) return "SERVICES";
  if (/feature|benefit/.test(p)) return "FEATURES";
  if (/footer/.test(p)) return "FOOTER";
  if (/header|nav/.test(p)) return "HEADER";
  if (/banner|hero|intro|saas|landing/.test(p)) return "HERO";
  if (/image|photo/.test(p)) return "IMAGE";
  return "TEXT";
}
