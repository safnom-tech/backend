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
let memoryServer;
let app;
async function createUserWithCookie(email) {
    const passwordHash = await (0, password_js_1.hashPassword)("password123");
    const user = await users_model_js_1.UserModel.create({
        email,
        passwordHash,
        name: "Test User",
    });
    const token = (0, jwt_js_1.signAccessToken)({
        sub: user._id.toString(),
        email: user.email,
    });
    const agent = supertest_1.default.agent(app);
    agent.set("Cookie", `${env_js_1.env.cookieName}=${token}`);
    return { agent };
}
async function createWorkspace(agent) {
    const res = await agent
        .post(`${env_js_1.env.apiPrefix}/workspaces`)
        .send({ name: "Pages WS" })
        .expect(201);
    return res.body.data.id;
}
async function createWebsite(agent, wsId) {
    const res = await agent
        .post(`${env_js_1.env.apiPrefix}/workspaces/${wsId}/websites`)
        .send({ name: "Site One" })
        .expect(201);
    return res.body.data.id;
}
function pagesApi(wsId, websiteId) {
    return `${env_js_1.env.apiPrefix}/workspaces/${wsId}/websites/${websiteId}/pages`;
}
(0, node_test_1.before)(async () => {
    memoryServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    await mongoose_1.default.disconnect();
    await mongoose_1.default.connect(memoryServer.getUri());
    app = (0, app_js_1.createApp)();
});
(0, node_test_1.after)(async () => {
    await mongoose_1.default.disconnect();
    await memoryServer.stop();
});
(0, node_test_1.describe)("Pages API", () => {
    (0, node_test_1.it)("creates page with DRAFT status", async () => {
        const { agent } = await createUserWithCookie("page-create@test.local");
        const wsId = await createWorkspace(agent);
        const siteId = await createWebsite(agent, wsId);
        const res = await agent
            .post(pagesApi(wsId, siteId))
            .send({ name: "About Us", pageType: "ABOUT" })
            .expect(201);
        strict_1.default.equal(res.body.data.status, "DRAFT");
        strict_1.default.equal(res.body.data.pageType, "ABOUT");
        strict_1.default.ok(res.body.data.slug);
    });
    (0, node_test_1.it)("enforces slug uniqueness per website", async () => {
        const { agent } = await createUserWithCookie("page-slug@test.local");
        const wsId = await createWorkspace(agent);
        const siteId = await createWebsite(agent, wsId);
        await agent
            .post(pagesApi(wsId, siteId))
            .send({ name: "Contact", slug: "contact", pageType: "CONTACT" })
            .expect(201);
        await agent
            .post(pagesApi(wsId, siteId))
            .send({ name: "Contact 2", slug: "contact" })
            .expect(409);
    });
    (0, node_test_1.it)("denies cross-workspace page access", async () => {
        const a = await createUserWithCookie("page-iso-a@test.local");
        const b = await createUserWithCookie("page-iso-b@test.local");
        const wsA = await createWorkspace(a.agent);
        const wsB = await createWorkspace(b.agent);
        const siteA = await createWebsite(a.agent, wsA);
        await createWebsite(b.agent, wsB);
        const page = await a.agent
            .post(pagesApi(wsA, siteA))
            .send({ name: "Secret" })
            .expect(201);
        const pageId = page.body.data.id;
        await b.agent.get(`${pagesApi(wsB, siteA)}/${pageId}`).expect(404);
    });
    (0, node_test_1.it)("manages sections: add, update, duplicate, reorder, delete", async () => {
        const { agent } = await createUserWithCookie("page-sect@test.local");
        const wsId = await createWorkspace(agent);
        const siteId = await createWebsite(agent, wsId);
        const listed = await agent.get(pagesApi(wsId, siteId)).expect(200);
        const pageId = listed.body.data.pages[0].id;
        const hero = await agent
            .post(`${pagesApi(wsId, siteId)}/${pageId}/sections`)
            .send({
            type: "HERO",
            data: { title: "Welcome" },
            settings: { alignment: "center" },
        })
            .expect(201);
        const heroId = hero.body.data.id;
        const text = await agent
            .post(`${pagesApi(wsId, siteId)}/${pageId}/sections`)
            .send({ type: "TEXT", data: { body: "Hello" } })
            .expect(201);
        const textId = text.body.data.id;
        await agent
            .patch(`${pagesApi(wsId, siteId)}/${pageId}/sections/${heroId}`)
            .send({ data: { title: "Updated" } })
            .expect(200);
        const dup = await agent
            .post(`${pagesApi(wsId, siteId)}/${pageId}/sections/${heroId}/duplicate`)
            .expect(201);
        strict_1.default.notEqual(dup.body.data.id, heroId);
        const reordered = await agent
            .patch(`${pagesApi(wsId, siteId)}/${pageId}/sections/reorder`)
            .send({
            sectionIds: [textId, dup.body.data.id, heroId],
        })
            .expect(200);
        strict_1.default.equal(reordered.body.data.sections[0].id, textId);
        await agent
            .delete(`${pagesApi(wsId, siteId)}/${pageId}/sections/${heroId}`)
            .expect(200);
        const got = await agent
            .get(`${pagesApi(wsId, siteId)}/${pageId}`)
            .expect(200);
        strict_1.default.equal(got.body.data.sections.length, 2);
    });
    (0, node_test_1.it)("deletes page", async () => {
        const { agent } = await createUserWithCookie("page-del@test.local");
        const wsId = await createWorkspace(agent);
        const siteId = await createWebsite(agent, wsId);
        const created = await agent
            .post(pagesApi(wsId, siteId))
            .send({ name: "Temp" })
            .expect(201);
        await agent
            .delete(`${pagesApi(wsId, siteId)}/${created.body.data.id}`)
            .expect(200);
        const list = await agent.get(pagesApi(wsId, siteId)).expect(200);
        // Blank create seeds a Home page; only the Temp page should be gone.
        strict_1.default.equal(list.body.data.pages.length, 1);
        strict_1.default.equal(list.body.data.pages[0].slug, "home");
    });
});
(0, node_test_1.describe)("Templates API", () => {
    (0, node_test_1.it)("lists templates", async () => {
        const { agent } = await createUserWithCookie("tpl-list@test.local");
        const res = await agent.get(`${env_js_1.env.apiPrefix}/templates`).expect(200);
        strict_1.default.equal(res.body.data.templates.length, 1);
        strict_1.default.equal(res.body.data.templates[0].id, "ocean-crown");
    });
    (0, node_test_1.it)("applies template with cloned page and section ids", async () => {
        const { agent } = await createUserWithCookie("tpl-apply@test.local");
        const wsId = await createWorkspace(agent);
        const created = await agent
            .post(`${env_js_1.env.apiPrefix}/workspaces/${wsId}/websites`)
            .send({ name: "From Template", templateId: "ocean-crown" })
            .expect(201);
        strict_1.default.ok(created.body.data.theme?.colors);
        strict_1.default.match(created.body.data.publicId, /^WEB-/);
        const siteId = created.body.data.id;
        const pages = await agent.get(pagesApi(wsId, siteId)).expect(200);
        strict_1.default.ok(pages.body.data.pages.length >= 1);
        const detail = await agent
            .get(`${env_js_1.env.apiPrefix}/templates/ocean-crown`)
            .expect(200);
        const templateHome = detail.body.data.pages.find((p) => p.slug === "home");
        const appliedHome = pages.body.data.pages.find((p) => p.slug === "home");
        strict_1.default.ok(templateHome && appliedHome);
        strict_1.default.equal(appliedHome.sections.length, templateHome.sections.length);
        for (const section of appliedHome.sections) {
            strict_1.default.match(section.id, /^[a-f\d]{24}$/i);
        }
    });
    (0, node_test_1.it)("applies Ocean Crown template with full page design", async () => {
        const { agent } = await createUserWithCookie("tpl-ocean@test.local");
        const wsId = await createWorkspace(agent);
        const created = await agent
            .post(`${env_js_1.env.apiPrefix}/workspaces/${wsId}/websites`)
            .send({
            name: "Ocean Crown",
            templateId: "ocean-crown",
        })
            .expect(201);
        strict_1.default.equal(created.body.data.theme?.colors?.primary, "#1a1a1a");
        const siteId = created.body.data.id;
        const pages = await agent.get(pagesApi(wsId, siteId)).expect(200);
        strict_1.default.equal(pages.body.data.pages.length, 1);
        const home = pages.body.data.pages[0];
        strict_1.default.equal(home.sections.length, 7);
        strict_1.default.equal(home.sections[0].settings.variant, "logistics");
        strict_1.default.equal(home.sections[1].data.title, "Around the World");
        strict_1.default.equal(home.sections[2].settings.variant, "serviceCards");
        for (const section of home.sections) {
            strict_1.default.match(section.id, /^[a-f\d]{24}$/i);
        }
    });
});
