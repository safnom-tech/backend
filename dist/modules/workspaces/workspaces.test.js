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
const API = `${env_js_1.env.apiPrefix}/workspaces`;
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
    return { userId: user._id.toString(), agent };
}
(0, node_test_1.describe)("Workspaces API", () => {
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
    (0, node_test_1.it)("creates workspace and assigns OWNER membership", async () => {
        const { agent } = await createUserWithCookie("owner-a@test.local");
        const res = await agent
            .post(API)
            .send({ name: "Acme Business" })
            .expect(201);
        strict_1.default.equal(res.body.success, true);
        strict_1.default.equal(res.body.data.name, "Acme Business");
        strict_1.default.match(res.body.data.slug, /^acme-business/);
        const current = await agent.get(`${API}/current`).expect(200);
        strict_1.default.equal(current.body.data.workspace.id, res.body.data.id);
    });
    (0, node_test_1.it)("lists only workspaces the user belongs to", async () => {
        const userA = await createUserWithCookie("list-a@test.local");
        const userB = await createUserWithCookie("list-b@test.local");
        const wsA = await userA.agent
            .post(API)
            .send({ name: "Workspace A" })
            .expect(201);
        await userB.agent.post(API).send({ name: "Workspace B" }).expect(201);
        const listA = await userA.agent.get(API).expect(200);
        strict_1.default.equal(listA.body.data.workspaces.length, 1);
        strict_1.default.equal(listA.body.data.workspaces[0].id, wsA.body.data.id);
        const listB = await userB.agent.get(API).expect(200);
        strict_1.default.equal(listB.body.data.workspaces.length, 1);
        strict_1.default.notEqual(listB.body.data.workspaces[0].id, wsA.body.data.id);
    });
    (0, node_test_1.it)("denies cross-workspace access with 404", async () => {
        const userA = await createUserWithCookie("iso-a@test.local");
        const userB = await createUserWithCookie("iso-b@test.local");
        const wsB = await userB.agent
            .post(API)
            .send({ name: "Secret B" })
            .expect(201);
        const workspaceBId = wsB.body.data.id;
        await userA.agent.get(`${API}/${workspaceBId}`).expect(404);
        await userA.agent
            .patch(`${API}/${workspaceBId}`)
            .send({ name: "Hacked" })
            .expect(404);
        await userA.agent.post(`${API}/${workspaceBId}/select`).expect(404);
    });
    (0, node_test_1.it)("switches current workspace", async () => {
        const { agent } = await createUserWithCookie("switch@test.local");
        const ws1 = await agent.post(API).send({ name: "First" }).expect(201);
        const ws2 = await agent.post(API).send({ name: "Second" }).expect(201);
        await agent.post(`${API}/${ws1.body.data.id}/select`).expect(200);
        let current = await agent.get(`${API}/current`).expect(200);
        strict_1.default.equal(current.body.data.workspace.id, ws1.body.data.id);
        await agent.post(`${API}/${ws2.body.data.id}/select`).expect(200);
        current = await agent.get(`${API}/current`).expect(200);
        strict_1.default.equal(current.body.data.workspace.id, ws2.body.data.id);
    });
    (0, node_test_1.it)("updates workspace name for member", async () => {
        const { agent } = await createUserWithCookie("patch@test.local");
        const created = await agent
            .post(API)
            .send({ name: "Old Name" })
            .expect(201);
        const updated = await agent
            .patch(`${API}/${created.body.data.id}`)
            .send({ name: "New Name" })
            .expect(200);
        strict_1.default.equal(updated.body.data.name, "New Name");
    });
    (0, node_test_1.it)("rejects duplicate slug with 409", async () => {
        const user1 = await createUserWithCookie("slug1@test.local");
        const user2 = await createUserWithCookie("slug2@test.local");
        await user1.agent
            .post(API)
            .send({ name: "My Shop", slug: "unique-shop" })
            .expect(201);
        const dup = await user2.agent
            .post(API)
            .send({ name: "Other", slug: "unique-shop" })
            .expect(409);
        strict_1.default.equal(dup.body.error.code, "WORKSPACE_SLUG_TAKEN");
    });
});
