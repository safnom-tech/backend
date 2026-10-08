"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const node_test_1 = require("node:test");
const mongoose_1 = __importDefault(require("mongoose"));
const supertest_1 = __importDefault(require("supertest"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const app_js_1 = require("../../app.js");
const env_js_1 = require("../../config/env.js");
const local_storage_js_1 = require("../../storage/local.storage.js");
const index_js_1 = require("../../storage/index.js");
const password_js_1 = require("../../utils/password.js");
const jwt_js_1 = require("../../utils/jwt.js");
const users_model_js_1 = require("../users/users.model.js");
let memoryServer;
let app;
let tempMediaRoot;
const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
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
        .send({ name: "Media Workspace" })
        .expect(201);
    return res.body.data.id;
}
function mediaApi(workspaceId) {
    return `${env_js_1.env.apiPrefix}/workspaces/${workspaceId}/media`;
}
(0, node_test_1.describe)("Media API", () => {
    (0, node_test_1.before)(async () => {
        tempMediaRoot = await promises_1.default.mkdtemp(node_path_1.default.join(node_os_1.default.tmpdir(), "safnom-media-"));
        (0, index_js_1.setStorageServiceForTests)(new local_storage_js_1.LocalStorageService(tempMediaRoot));
        memoryServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        await mongoose_1.default.disconnect();
        await mongoose_1.default.connect(memoryServer.getUri());
        app = (0, app_js_1.createApp)();
    });
    (0, node_test_1.after)(async () => {
        await mongoose_1.default.disconnect();
        await memoryServer.stop();
        (0, index_js_1.setStorageServiceForTests)(null);
        await promises_1.default.rm(tempMediaRoot, { recursive: true, force: true });
    });
    (0, node_test_1.it)("uploads image and lists media", async () => {
        const { agent } = await createUserWithCookie("media-up@test.local");
        const wsId = await createWorkspace(agent);
        const upload = await agent
            .post(mediaApi(wsId))
            .attach("file", PNG_1X1, {
            filename: "dot.png",
            contentType: "image/png",
        })
            .expect(201);
        strict_1.default.equal(upload.body.data.mimeType, "image/png");
        strict_1.default.ok(upload.body.data.url.includes("/content"));
        const list = await agent.get(mediaApi(wsId)).expect(200);
        strict_1.default.equal(list.body.data.media.length, 1);
    });
    (0, node_test_1.it)("serves content with correct type", async () => {
        const { agent } = await createUserWithCookie("media-content@test.local");
        const wsId = await createWorkspace(agent);
        const upload = await agent
            .post(mediaApi(wsId))
            .attach("file", PNG_1X1, "a.png")
            .expect(201);
        const mediaId = upload.body.data.id;
        const res = await agent
            .get(`${mediaApi(wsId)}/${mediaId}/content`)
            .expect(200);
        strict_1.default.match(String(res.headers["content-type"]), /image\/png/);
        strict_1.default.ok(res.body.length > 0);
    });
    (0, node_test_1.it)("replaces media file", async () => {
        const { agent } = await createUserWithCookie("media-replace@test.local");
        const wsId = await createWorkspace(agent);
        const upload = await agent
            .post(mediaApi(wsId))
            .attach("file", PNG_1X1, "old.png")
            .expect(201);
        const mediaId = upload.body.data.id;
        const replaced = await agent
            .patch(`${mediaApi(wsId)}/${mediaId}`)
            .attach("file", PNG_1X1, "new.png")
            .expect(200);
        strict_1.default.equal(replaced.body.data.originalFilename, "new.png");
    });
    (0, node_test_1.it)("deletes media", async () => {
        const { agent } = await createUserWithCookie("media-del@test.local");
        const wsId = await createWorkspace(agent);
        const upload = await agent
            .post(mediaApi(wsId))
            .attach("file", PNG_1X1, "del.png")
            .expect(201);
        const mediaId = upload.body.data.id;
        await agent.delete(`${mediaApi(wsId)}/${mediaId}`).expect(200);
        await agent.get(`${mediaApi(wsId)}/${mediaId}`).expect(404);
    });
    (0, node_test_1.it)("rejects invalid file type", async () => {
        const { agent } = await createUserWithCookie("media-bad@test.local");
        const wsId = await createWorkspace(agent);
        await agent
            .post(mediaApi(wsId))
            .attach("file", Buffer.from("not an image"), {
            filename: "bad.txt",
            contentType: "text/plain",
        })
            .expect(400);
    });
    (0, node_test_1.it)("denies cross-workspace media access", async () => {
        const a = await createUserWithCookie("media-iso-a@test.local");
        const b = await createUserWithCookie("media-iso-b@test.local");
        const wsA = await createWorkspace(a.agent);
        const wsB = await createWorkspace(b.agent);
        const upload = await a.agent
            .post(mediaApi(wsA))
            .attach("file", PNG_1X1, "secret.png")
            .expect(201);
        const mediaId = upload.body.data.id;
        await b.agent.get(`${mediaApi(wsB)}/${mediaId}`).expect(404);
        await b.agent
            .get(`${mediaApi(wsA)}/${mediaId}/content`)
            .expect(404);
    });
});
