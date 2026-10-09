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
(0, node_test_1.describe)("Websites API", () => {
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
    (0, node_test_1.it)("creates website with DRAFT status", async () => {
        const { agent } = await createUserWithCookie("web-create@test.local");
        const wsId = await createWorkspace(agent);
        const res = await agent
            .post(websitesApi(wsId))
            .send({ name: "My Shop", description: "Local store" })
            .expect(201);
        strict_1.default.equal(res.body.data.status, "DRAFT");
        strict_1.default.equal(res.body.data.name, "My Shop");
        strict_1.default.equal(res.body.data.workspaceId, wsId);
    });
    (0, node_test_1.it)("lists only websites in the workspace", async () => {
        const a = await createUserWithCookie("web-list-a@test.local");
        const b = await createUserWithCookie("web-list-b@test.local");
        const wsA = await createWorkspace(a.agent);
        const wsB = await createWorkspace(b.agent);
        const created = await a.agent
            .post(websitesApi(wsA))
            .send({ name: "Site A" })
            .expect(201);
        await b.agent.post(websitesApi(wsB)).send({ name: "Site B" }).expect(201);
        const listA = await a.agent.get(websitesApi(wsA)).expect(200);
        strict_1.default.equal(listA.body.data.websites.length, 1);
        strict_1.default.equal(listA.body.data.websites[0].id, created.body.data.id);
    });
    (0, node_test_1.it)("denies cross-workspace website access", async () => {
        const a = await createUserWithCookie("web-iso-a@test.local");
        const b = await createUserWithCookie("web-iso-b@test.local");
        const wsA = await createWorkspace(a.agent);
        const wsB = await createWorkspace(b.agent);
        const site = await a.agent
            .post(websitesApi(wsA))
            .send({ name: "Secret" })
            .expect(201);
        const siteId = site.body.data.id;
        await b.agent.get(`${websitesApi(wsB)}/${siteId}`).expect(404);
        await b.agent
            .patch(`${websitesApi(wsB)}/${siteId}`)
            .send({ name: "Hack" })
            .expect(404);
        await b.agent.delete(`${websitesApi(wsB)}/${siteId}`).expect(404);
    });
    (0, node_test_1.it)("updates website status", async () => {
        const { agent } = await createUserWithCookie("web-patch@test.local");
        const wsId = await createWorkspace(agent);
        const created = await agent
            .post(websitesApi(wsId))
            .send({ name: "Patch Me" })
            .expect(201);
        const updated = await agent
            .patch(`${websitesApi(wsId)}/${created.body.data.id}`)
            .send({ status: "PUBLISHED" })
            .expect(200);
        strict_1.default.equal(updated.body.data.status, "PUBLISHED");
    });
    (0, node_test_1.it)("updates website theme", async () => {
        const { agent } = await createUserWithCookie("web-theme@test.local");
        const wsId = await createWorkspace(agent);
        const created = await agent
            .post(websitesApi(wsId))
            .send({ name: "Themed Site" })
            .expect(201);
        const siteId = created.body.data.id;
        await agent
            .patch(`${websitesApi(wsId)}/${siteId}`)
            .send({
            theme: {
                colors: { primary: "#ff0000", text: "#111111" },
            },
        })
            .expect(200);
        const got = await agent.get(`${websitesApi(wsId)}/${siteId}`).expect(200);
        strict_1.default.equal(got.body.data.theme.colors.primary, "#ff0000");
        strict_1.default.equal(got.body.data.theme.colors.text, "#111111");
    });
    (0, node_test_1.it)("deletes website", async () => {
        const { agent } = await createUserWithCookie("web-del@test.local");
        const wsId = await createWorkspace(agent);
        const created = await agent
            .post(websitesApi(wsId))
            .send({ name: "Delete Me" })
            .expect(201);
        await agent
            .delete(`${websitesApi(wsId)}/${created.body.data.id}`)
            .expect(200);
        const list = await agent.get(websitesApi(wsId)).expect(200);
        strict_1.default.equal(list.body.data.websites.length, 0);
    });
});
