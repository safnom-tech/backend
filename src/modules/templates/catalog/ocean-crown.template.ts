import type {
  PublicTemplateSummary,
  TemplateDefinition,
} from "../templates.types.js";

const oceanTheme = {
  colors: {
    primary: "#1a1a1a",
    secondary: "#3a3a3a",
    background: "#ffffff",
    text: "#1a1a1a",
  },
  typography: {
    headingFont:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    bodyFont:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  buttons: { style: "pill", size: "medium" },
};

const IMG = {
  hero: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1800&q=80",
  team: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80",
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
  meeting: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80",
  container: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80",
  crane: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=900&q=80",
};

export const oceanCrownSummary: PublicTemplateSummary = {
  id: "ocean-crown",
  name: "Ocean Crown Logistics",
  category: "Logistics",
  description:
    "Corporate freight & shipping homepage — dark header, cinematic hero, service cards, why-choose, innovation, and services grid.",
};

/** Single-page logistics / freight corporate site (Ocean Crown style). */
export const oceanCrownTemplate: TemplateDefinition = {
  ...oceanCrownSummary,
  theme: oceanTheme,
  pages: [
    {
      name: "Home",
      slug: "home",
      pageType: "HOME",
      seo: {
        title: "Ocean Crown Shipping Services LLC",
        metaDescription:
          "Ocean Crown ships anything around the world — air, land, sea freight, project cargo, and shipping agency services.",
      },
      sections: [
        {
          type: "HEADER",
          order: 0,
          data: {
            logoText: "Ocean Crown",
            logoSub: "Shipping Services LLC",
            phone: "+971 581 52288",
          },
          settings: {
            variant: "logistics",
            paddingY: "none",
            backgroundColor: "#1a1a1a",
            textColor: "#ffffff",
          },
        },
        {
          type: "HERO",
          order: 1,
          data: {
            eyebrow: "Ships Anything",
            title: "Around the World",
            buttonText: "Quote?",
            buttonUrl: "#contact",
            imageUrl: IMG.hero,
            imageAlt: "Shipping containers at port",
          },
          settings: {
            variant: "logistics",
            paddingY: "none",
            backgroundColor: "#111111",
            textColor: "#ffffff",
          },
        },
        {
          type: "SERVICES",
          order: 2,
          data: {
            activeTitle: "Project Cargo",
            items: [
              "Air Freight|Shipping via Air",
              "Land Freight|Cargo Transport",
              "Sea Freight|Ocean Shipping",
              "Project Cargo|Handling Service",
              "Shipping Agency|Port Agency",
            ],
          },
          settings: {
            variant: "serviceCards",
            paddingY: "none",
            backgroundColor: "#f3f3f3",
          },
        },
        {
          type: "FEATURES",
          order: 3,
          data: {
            heading: "Why Choose Us?",
            pillars: [
              "In-Depth Knowledge",
              "Excellence & Leadership",
              "Competitive Pricing",
            ],
            body:
              "Ocean Crown Shipping Services LLC is a trusted international freight forwarder with deep expertise across air, land, and sea logistics.\n\nFrom Dubai to Amman, Aqaba, Basra, Baghdad, and Antwerp, our teams deliver end-to-end solutions for complex cargo, project shipments, and everyday freight — with precision, transparency, and competitive pricing.",
            imageUrl: IMG.team,
            imageUrl2: IMG.office,
            imageUrl3: IMG.meeting,
            imageAlt: "Ocean Crown team meeting",
          },
          settings: {
            variant: "whyChoose",
            paddingY: "none",
            backgroundColor: "#ffffff",
          },
        },
        {
          type: "FEATURES",
          order: 4,
          data: {
            heading: "Freight Company With a Difference. Innovation.",
            body:
              "We combine operational excellence with modern logistics thinking — so every shipment moves smarter, faster, and with complete visibility.",
            signature: "Anwar Taher",
            signatureRole: "Founder & Director",
            cards: [
              {
                title: "Who We Are",
                body:
                  "A full-service freight partner built for international trade, project cargo, and reliable last-mile coordination.",
                imageUrl: IMG.container,
              },
              {
                title: "Logistics Redefined",
                body:
                  "Integrated air, land, and sea solutions designed around your cargo — not the other way around.",
                imageUrl: IMG.crane,
              },
            ],
          },
          settings: {
            variant: "innovation",
            paddingY: "none",
            backgroundColor: "#ffffff",
          },
        },
        {
          type: "SERVICES",
          order: 5,
          data: {
            heading: "Unmatched Services. Unmatched Excellence.",
            activeTitle: "Land Freight",
            items: [
              "Air Freight|Provides air freight services to meet up with your transportation needs, professional services to deliver your air freight fast and safe to its final destination.",
              "Land Freight|Provides land freight services to meet up with your transportation needs, professional services to deliver your cargo fast and safe to its final destination.",
              "Sea Freight|Provides sea freight services to meet up with your transportation needs, professional services to deliver your ocean cargo fast and safe to its final destination.",
              "Project Cargo|Provides project cargo services to meet up with your transportation needs, professional handling for oversized and complex shipments.",
              "Shipping Agency|Provides shipping agency services to meet up with your transportation needs, port representation and documentation support.",
            ],
          },
          settings: {
            variant: "darkServiceGrid",
            paddingY: "none",
            backgroundColor: "#121212",
            textColor: "#ffffff",
          },
        },
        {
          type: "CONTACT",
          order: 6,
          data: {
            heading: "Contact us",
            submitLabel: "Send message",
            successMessage: "Thank you — your inquiry was sent successfully.",
          },
          settings: {
            variant: "logistics",
            paddingY: "none",
            backgroundColor: "#f3f3f3",
          },
        },
        {
          type: "FOOTER",
          order: 7,
          data: {
            logoText: "Ocean Crown",
            about:
              "International freight forwarding and shipping agency services — air, land, sea, and project cargo worldwide.",
            servicesHeading: "Services",
            quickHeading: "Quicklinks",
            subscribeHeading: "Subscribe",
            subscribeBody: "Get to know about Ocean Crown updates and offers.",
            subscribePlaceholder: "Email address",
            subscribeButton: "Go",
            copyright: "© Ocean Crown Shipping Services LLC. All rights reserved.",
          },
          settings: {
            variant: "logistics",
            paddingY: "none",
            backgroundColor: "#111111",
            textColor: "#ffffff",
          },
        },
      ],
    },
  ],
};
