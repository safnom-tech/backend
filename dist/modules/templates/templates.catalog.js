"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEMPLATE_CATALOG = void 0;
const baseTheme = {
    colors: { primary: "#3da6ad", background: "#ffffff", text: "#1a3a4a" },
    typography: { headingFont: "system-ui", bodyFont: "system-ui" },
    buttons: { style: "rounded", size: "medium" },
};
function heroSection(data) {
    return {
        type: "HERO",
        order: 1,
        data,
        settings: { alignment: "center" },
    };
}
exports.TEMPLATE_CATALOG = [
    {
        id: "business-starter",
        name: "Business Starter",
        category: "Business",
        description: "Home, services, and contact for local businesses.",
        theme: baseTheme,
        pages: [
            {
                name: "Home",
                slug: "home",
                pageType: "HOME",
                sections: [
                    { type: "HEADER", order: 0, data: { logoText: "Your Business" }, settings: {} },
                    heroSection({
                        title: "Grow your business online",
                        description: "Professional presence in minutes.",
                        buttonText: "Get started",
                    }),
                    { type: "FEATURES", order: 2, data: { heading: "Why choose us" }, settings: {} },
                    { type: "FOOTER", order: 3, data: { copyright: "© Your Business" }, settings: {} },
                ],
            },
            {
                name: "Services",
                slug: "services",
                pageType: "SERVICES",
                sections: [
                    { type: "HEADER", order: 0, data: {}, settings: {} },
                    { type: "SERVICES", order: 1, data: { heading: "Our services" }, settings: {} },
                    { type: "FOOTER", order: 2, data: {}, settings: {} },
                ],
            },
        ],
    },
    {
        id: "agency-modern",
        name: "Modern Agency",
        category: "Agency",
        description: "Showcase work and capture leads.",
        theme: {
            ...baseTheme,
            colors: { primary: "#6366f1", background: "#0f172a", text: "#f8fafc" },
        },
        pages: [
            {
                name: "Home",
                slug: "home",
                pageType: "HOME",
                sections: [
                    { type: "HEADER", order: 0, data: {}, settings: {} },
                    heroSection({
                        title: "We build brands that stand out",
                        description: "Strategy, design, and development.",
                        buttonText: "View work",
                    }),
                    { type: "GALLERY", order: 2, data: { heading: "Selected work" }, settings: {} },
                    { type: "CONTACT", order: 3, data: { heading: "Start a project" }, settings: {} },
                    { type: "FOOTER", order: 4, data: {}, settings: {} },
                ],
            },
        ],
    },
    {
        id: "restaurant-classic",
        name: "Classic Restaurant",
        category: "Restaurant",
        description: "Menu highlights, hours, and reservations CTA.",
        theme: {
            ...baseTheme,
            colors: { primary: "#b45309", background: "#fffbeb", text: "#292524" },
        },
        pages: [
            {
                name: "Home",
                slug: "home",
                pageType: "HOME",
                sections: [
                    { type: "HEADER", order: 0, data: {}, settings: {} },
                    heroSection({
                        title: "Fresh food, warm atmosphere",
                        description: "Dine in or order online.",
                        buttonText: "View menu",
                    }),
                    { type: "TEXT", order: 2, data: { body: "Hours: Tue–Sun 11am–10pm" }, settings: {} },
                    { type: "FOOTER", order: 3, data: {}, settings: {} },
                ],
            },
        ],
    },
    {
        id: "portfolio-creative",
        name: "Creative Portfolio",
        category: "Portfolio",
        description: "Project gallery and about page.",
        theme: baseTheme,
        pages: [
            {
                name: "Home",
                slug: "home",
                pageType: "HOME",
                sections: [
                    { type: "HERO", order: 0, data: { title: "Hello, I'm Alex" }, settings: { alignment: "left" } },
                    { type: "GALLERY", order: 1, data: { heading: "Projects" }, settings: {} },
                    { type: "FOOTER", order: 2, data: {}, settings: {} },
                ],
            },
            {
                name: "About",
                slug: "about",
                pageType: "ABOUT",
                sections: [
                    { type: "TEXT", order: 0, data: { body: "Designer and developer." }, settings: {} },
                ],
            },
        ],
    },
    {
        id: "professional-services",
        name: "Professional Services",
        category: "Professional Services",
        description: "Trust-building layout for consultants and firms.",
        theme: baseTheme,
        pages: [
            {
                name: "Home",
                slug: "home",
                pageType: "HOME",
                sections: [
                    { type: "HEADER", order: 0, data: {}, settings: {} },
                    heroSection({
                        title: "Expert advice you can trust",
                        description: "Serving clients since 2010.",
                        buttonText: "Book consultation",
                    }),
                    { type: "TESTIMONIALS", order: 2, data: { heading: "Client stories" }, settings: {} },
                    { type: "FAQ", order: 3, data: { heading: "Common questions" }, settings: {} },
                    { type: "CONTACT", order: 4, data: {}, settings: {} },
                    { type: "FOOTER", order: 5, data: {}, settings: {} },
                ],
            },
            {
                name: "Contact",
                slug: "contact",
                pageType: "CONTACT",
                sections: [
                    { type: "CONTACT", order: 0, data: { heading: "Get in touch" }, settings: {} },
                ],
            },
        ],
    },
];
