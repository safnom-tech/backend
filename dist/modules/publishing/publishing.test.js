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
        .send({ name: "Test Workspace" })
        .expect(201);
    return res.body.data.id;
}
function websitesApi(workspaceId) {
    return `${env_js_1.env.apiPrefix}/workspaces/${workspaceId}/websites`;
}
function publicSiteApi(subdomain) {
    return `${env_js_1.env.apiPrefix}/public/sites/${subdomain}`;
}
(0, node_test_1.describe)("Publishing API", () => {
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
    (0, node_test_1.it)("rejects PATCH status bypass", async () => {
        const { agent } = await createUserWithCookie("pub-patch-status@test.local");
        const wsId = await createWorkspace(agent);
        const created = await agent
            .post(websitesApi(wsId))
            .send({ name: "No Status Patch" })
            .expect(201);
        await agent
            .patch(`${websitesApi(wsId)}/${created.body.data.id}`)
            .send({ status: "PUBLISHED" })
            .expect(400);
    });
    (0, node_test_1.it)("publishes website and serves public snapshot", async () => {
        const { agent } = await createUserWithCookie("pub-live@test.local");
        const wsId = await createWorkspace(agent);
        const created = await agent
            .post(websitesApi(wsId))
            .send({ name: "ABC Shop" })
            .expect(201);
        const siteId = created.body.data.id;
        await agent
            .post(`${websitesApi(wsId)}/${siteId}/publish`)
            .send({ subdomain: "abc-shop-pub" })
            .expect(200);
        const pub = await (0, supertest_1.default)(app)
            .get(publicSiteApi("abc-shop-pub"))
            .expect(200);
        strict_1.default.match(pub.body.data.website.name, /ABC Shop/);
        strict_1.default.ok(pub.body.data.page.sections.length >= 0);
    });
    (0, node_test_1.it)("keeps public content when draft changes without republish", async () => {
        const { agent } = await createUserWithCookie("pub-draft-iso@test.local");
        const wsId = await createWorkspace(agent);
        const created = await agent
            .post(websitesApi(wsId))
            .send({ name: "Welcome ABC" })
            .expect(201);
        const siteId = created.body.data.id;
        const pages = await agent
            .get(`${websitesApi(wsId)}/${siteId}/pages`)
            .expect(200);
        const homeId = pages.body.data.pages[0].id;
        await agent
            .patch(`${websitesApi(wsId)}/${siteId}/pages/${homeId}`)
            .send({ seo: { title: "Welcome ABC" } })
            .expect(200);
        await agent
            .post(`${websitesApi(wsId)}/${siteId}/publish`)
            .send({ subdomain: "draft-iso-site" })
            .expect(200);
        await agent
            .patch(`${websitesApi(wsId)}/${siteId}/pages/${homeId}`)
            .send({ seo: { title: "Welcome XYZ" } })
            .expect(200);
        const live = await (0, supertest_1.default)(app)
            .get(publicSiteApi("draft-iso-site"))
            .expect(200);
        strict_1.default.equal(live.body.data.page.seo.title, "Welcome ABC");
        await agent.post(`${websitesApi(wsId)}/${siteId}/publish`).expect(200);
        const live2 = await (0, supertest_1.default)(app)
            .get(publicSiteApi("draft-iso-site"))
            .expect(200);
        strict_1.default.equal(live2.body.data.page.seo.title, "Welcome XYZ");
    });
    (0, node_test_1.it)("unpublish stops public access", async () => {
        const { agent } = await createUserWithCookie("pub-unpub@test.local");
        const wsId = await createWorkspace(agent);
        const created = await agent
            .post(websitesApi(wsId))
            .send({ name: "Temp Live" })
            .expect(201);
        const siteId = created.body.data.id;
        await agent
            .post(`${websitesApi(wsId)}/${siteId}/publish`)
            .send({ subdomain: "temp-live-site" })
            .expect(200);
        await agent
            .post(`${websitesApi(wsId)}/${siteId}/unpublish`)
            .expect(200);
        await (0, supertest_1.default)(app).get(publicSiteApi("temp-live-site")).expect(404);
    });
    (0, node_test_1.it)("rejects reserved subdomain", async () => {
        const { agent } = await createUserWithCookie("pub-reserved@test.local");
        const wsId = await createWorkspace(agent);
        const created = await agent
            .post(websitesApi(wsId))
            .send({ name: "Admin Site" })
            .expect(201);
        const siteId = created.body.data.id;
        const res = await agent
            .post(`${websitesApi(wsId)}/${siteId}/publish`)
            .send({ subdomain: "admin" })
            .expect(400);
        strict_1.default.equal(res.body.error.code, "SUBDOMAIN_RESERVED");
    });
    (0, node_test_1.it)("rejects duplicate subdomain", async () => {
        const a = await createUserWithCookie("pub-dup-a@test.local");
        const b = await createUserWithCookie("pub-dup-b@test.local");
        const wsA = await createWorkspace(a.agent);
        const wsB = await createWorkspace(b.agent);
        const siteA = await a.agent
            .post(websitesApi(wsA))
            .send({ name: "First" })
            .expect(201);
        await b.agent.post(websitesApi(wsB)).send({ name: "Second" }).expect(201);
        await a.agent
            .post(`${websitesApi(wsA)}/${siteA.body.data.id}/publish`)
            .send({ subdomain: "shared-name" })
            .expect(200);
        const siteB = await b.agent
            .get(websitesApi(wsB))
            .expect(200);
        const siteBId = siteB.body.data.websites[0].id;
        const res = await b.agent
            .post(`${websitesApi(wsB)}/${siteBId}/publish`)
            .send({ subdomain: "shared-name" })
            .expect(409);
        strict_1.default.equal(res.body.error.code, "SUBDOMAIN_TAKEN");
    });
    (0, node_test_1.it)("denies cross-workspace publish", async () => {
        const a = await createUserWithCookie("pub-xws-a@test.local");
        const b = await createUserWithCookie("pub-xws-b@test.local");
        const wsA = await createWorkspace(a.agent);
        const wsB = await createWorkspace(b.agent);
        const site = await a.agent
            .post(websitesApi(wsA))
            .send({ name: "Private" })
            .expect(201);
        const siteId = site.body.data.id;
        await b.agent
            .post(`${websitesApi(wsB)}/${siteId}/publish`)
            .send({ subdomain: "hack-site" })
            .expect(404);
    });
    (0, node_test_1.it)("serves multiple page slugs from snapshot", async () => {
        const { agent } = await createUserWithCookie("pub-pages@test.local");
        const wsId = await createWorkspace(agent);
        const created = await agent
            .post(websitesApi(wsId))
            .send({ name: "Multi Page" })
            .expect(201);
        const siteId = created.body.data.id;
        await agent
            .post(`${websitesApi(wsId)}/${siteId}/pages`)
            .send({ name: "About Us", slug: "about", pageType: "ABOUT" })
            .expect(201);
        await agent
            .post(`${websitesApi(wsId)}/${siteId}/publish`)
            .send({ subdomain: "multi-page-site" })
            .expect(200);
        const about = await (0, supertest_1.default)(app)
            .get(`${publicSiteApi("multi-page-site")}?pageSlug=about`)
            .expect(200);
        strict_1.default.equal(about.body.data.page.slug, "about");
    });
});
