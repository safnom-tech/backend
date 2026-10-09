"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const mongoose_1 = __importDefault(require("mongoose"));
const supertest_1 = __importDefault(require("supertest"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const app_js_1 = require("../../app.js");
const env_js_1 = require("../../config/env.js");
const password_js_1 = require("../../utils/password.js");
const jwt_js_1 = require("../../utils/jwt.js");
const users_model_js_1 = require("../users/users.model.js");
const mock_provider_js_1 = require("./providers/mock.provider.js");
const ai_response_parser_js_1 = require("./utils/ai-response-parser.js");
const ai_validation_js_1 = require("./ai.validation.js");
let memoryServer;
let app;
async function createUserWithCookie(email) {
    const passwordHash = await (0, password_js_1.hashPassword)("password123");
    const user = await users_model_js_1.UserModel.create({
        email,
        passwordHash,
        name: "Test User",
    });
    const token = (0, jwt_js_1.signAccessToken)({ sub: user._id.toString(), email: user.email });
    const agent = supertest_1.default.agent(app);
    agent.set("Cookie", `${env_js_1.env.cookieName}=${token}`);
    return { agent };
}
async function createWorkspace(agent) {
    const res = await agent
        .post(`${env_js_1.env.apiPrefix}/workspaces`)
        .send({ name: "AI Workspace" })
        .expect(201);
    return res.body.data.id;
}
async function getHomePageId(agent, wsId, websiteId) {
    const pages = await agent
        .get(`${env_js_1.env.apiPrefix}/workspaces/${wsId}/websites/${websiteId}/pages`)
        .expect(200);
    const home = pages.body.data.pages.find((p) => p.slug === "home") ??
        pages.body.data.pages[0];
    return home.id;
}
function aiApi(workspaceId) {
    return `${env_js_1.env.apiPrefix}/workspaces/${workspaceId}/ai`;
}
(0, node_test_1.describe)("AI utilities", () => {
    (0, node_test_1.it)("parses fenced JSON", () => {
        const v = (0, ai_response_parser_js_1.parseJsonFromModelText)('```json\n{"a":1}\n```');
        strict_1.default.deepEqual(v, { a: 1 });
    });
    (0, node_test_1.it)("rejects unsafe section strings", () => {
        strict_1.default.throws(() => (0, ai_validation_js_1.validateSectionData)("HERO", {
            title: "<script>alert(1)</script>",
        }));
    });
});
(0, node_test_1.describe)("AI API", () => {
    (0, node_test_1.before)(async () => {
        (0, mock_provider_js_1.setMockAiBehavior)("normal");
        memoryServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        await mongoose_1.default.disconnect();
        await mongoose_1.default.connect(memoryServer.getUri());
        app = (0, app_js_1.createApp)();
    });
    (0, node_test_1.after)(async () => {
        (0, mock_provider_js_1.setMockAiBehavior)("normal");
        await mongoose_1.default.disconnect();
        await memoryServer.stop();
    });
    (0, node_test_1.it)("generates website draft from business info", async () => {
        const { agent } = await createUserWithCookie("ai-web@test.local");
        const wsId = await createWorkspace(agent);
        const res = await agent
            .post(`${aiApi(wsId)}/website/generate`)
            .send({
            businessName: "ABC Dental Clinic",
            businessType: "Dental Clinic",
            businessDescription: "Family dental care in Pune.",
            location: "Pune, Maharashtra",
            services: ["Cleaning", "Implants"],
            websiteStyle: "Modern and professional",
        })
            .expect(201);
        strict_1.default.equal(res.body.data.website.name, "ABC Dental Clinic");
        strict_1.default.ok(res.body.data.pages.length >= 1);
        strict_1.default.ok(res.body.data.pages[0].sections.length >= 3);
    });
    (0, node_test_1.it)("returns section rewrite suggestion", async () => {
        const { agent } = await createUserWithCookie("ai-section@test.local");
        const wsId = await createWorkspace(agent);
        const site = await agent
            .post(`${env_js_1.env.apiPrefix}/workspaces/${wsId}/websites`)
            .send({ name: "AI Site" })
            .expect(201);
        const websiteId = site.body.data.id;
        const pageId = await getHomePageId(agent, wsId, websiteId);
        const section = await agent
            .post(`${env_js_1.env.apiPrefix}/workspaces/${wsId}/websites/${websiteId}/pages/${pageId}/sections`)
            .send({
            type: "HERO",
            data: { title: "Hello", description: "Old text" },
        })
            .expect(201);
        const sectionId = section.body.data.id;
        const ai = await agent
            .post(`${aiApi(wsId)}/section/action`)
            .send({
            action: "rewrite",
            websiteId,
            pageId,
            sectionId,
            sectionType: "HERO",
            content: { title: "Hello", description: "Old text" },
        })
            .expect(200);
        strict_1.default.ok(ai.body.data.data.title);
    });
    (0, node_test_1.it)("creates section draft from prompt", async () => {
        const { agent } = await createUserWithCookie("ai-create-sec@test.local");
        const wsId = await createWorkspace(agent);
        const site = await agent
            .post(`${env_js_1.env.apiPrefix}/workspaces/${wsId}/websites`)
            .send({ name: "Prompt Site" })
            .expect(201);
        const websiteId = site.body.data.id;
        const pageId = await getHomePageId(agent, wsId, websiteId);
        const res = await agent
            .post(`${aiApi(wsId)}/section/action`)
            .send({
            action: "create_from_prompt",
            websiteId,
            pageId,
            prompt: "Add an FAQ section about our hours and location",
            businessContext: { businessName: "Prompt Site" },
        })
            .expect(200);
        strict_1.default.equal(res.body.data.type, "COMPOSED");
        strict_1.default.ok(res.body.data.data.section);
        strict_1.default.ok(res.body.data.data.section.root);
    });
    (0, node_test_1.it)("generates composed section via dedicated endpoint", async () => {
        const { agent } = await createUserWithCookie("ai-composed@test.local");
        const wsId = await createWorkspace(agent);
        const site = await agent
            .post(`${env_js_1.env.apiPrefix}/workspaces/${wsId}/websites`)
            .send({ name: "Composed Site" })
            .expect(201);
        const websiteId = site.body.data.id;
        const pageId = await getHomePageId(agent, wsId, websiteId);
        const res = await agent
            .post(`${aiApi(wsId)}/sections/generate`)
            .send({
            websiteId,
            pageId,
            prompt: "Create a premium About Me section with profile image, experience stats, skills, and a contact button.",
            designStyle: "premium",
            sectionTypeHint: "about",
        })
            .expect(200);
        strict_1.default.equal(res.body.data.type, "COMPOSED");
        strict_1.default.equal(res.body.data.section.semanticType, "about");
        strict_1.default.equal(res.body.data.data.schemaVersion, 1);
    });
    (0, node_test_1.it)("creates premium hero from banner prompt", async () => {
        const { agent } = await createUserWithCookie("ai-hero-prompt@test.local");
        const wsId = await createWorkspace(agent);
        const site = await agent
            .post(`${env_js_1.env.apiPrefix}/workspaces/${wsId}/websites`)
            .send({ name: "Hero Co" })
            .expect(201);
        const websiteId = site.body.data.id;
        const pageId = await getHomePageId(agent, wsId, websiteId);
        const res = await agent
            .post(`${aiApi(wsId)}/section/action`)
            .send({
            action: "create_from_prompt",
            websiteId,
            pageId,
            prompt: "Modern Banner/Hero with 2-column layout, image right, primary and secondary CTA",
            businessContext: { businessName: "Hero Co", businessType: "SaaS" },
        })
            .expect(200);
        strict_1.default.equal(res.body.data.type, "COMPOSED");
        strict_1.default.ok(res.body.data.data.section?.root);
    });
    (0, node_test_1.it)("returns SEO suggestion", async () => {
        const { agent } = await createUserWithCookie("ai-seo@test.local");
        const wsId = await createWorkspace(agent);
        const site = await agent
            .post(`${env_js_1.env.apiPrefix}/workspaces/${wsId}/websites`)
            .send({ name: "SEO Site" })
            .expect(201);
        const websiteId = site.body.data.id;
        const pageId = await getHomePageId(agent, wsId, websiteId);
        const res = await agent
            .post(`${aiApi(wsId)}/section/action`)
            .send({
            action: "seo_title",
            websiteId,
            pageId,
            businessContext: { businessName: "SEO Site" },
        })
            .expect(200);
        strict_1.default.ok(res.body.data.seo.title);
    });
    (0, node_test_1.it)("rejects invalid mock AI JSON", async () => {
        (0, mock_provider_js_1.setMockAiBehavior)("bad_json");
        const { agent } = await createUserWithCookie("ai-bad@test.local");
        const wsId = await createWorkspace(agent);
        await agent
            .post(`${aiApi(wsId)}/website/generate`)
            .send({
            businessName: "Bad Co",
            businessType: "Shop",
            businessDescription: "Test business description here.",
            location: "City",
            services: ["One"],
            websiteStyle: "Simple",
        })
            .expect(400);
        (0, mock_provider_js_1.setMockAiBehavior)("normal");
    });
    (0, node_test_1.it)("denies cross-workspace AI access", async () => {
        const a = await createUserWithCookie("ai-iso-a@test.local");
        const b = await createUserWithCookie("ai-iso-b@test.local");
        const wsA = await createWorkspace(a.agent);
        const wsB = await createWorkspace(b.agent);
        const site = await a.agent
            .post(`${env_js_1.env.apiPrefix}/workspaces/${wsA}/websites`)
            .send({ name: "Private" })
            .expect(201);
        const websiteId = site.body.data.id;
        const pageId = await getHomePageId(a.agent, wsA, websiteId);
        await b.agent
            .post(`${aiApi(wsB)}/section/action`)
            .send({
            action: "seo_title",
            websiteId,
            pageId,
        })
            .expect(404);
    });
});
