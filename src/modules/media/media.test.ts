import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../../app.js";
import { env } from "../../config/env.js";
import { LocalStorageService } from "../../storage/local.storage.js";
import { setStorageServiceForTests } from "../../storage/index.js";
import { hashPassword } from "../../utils/password.js";
import { signAccessToken } from "../../utils/jwt.js";
import { UserModel } from "../users/users.model.js";

let memoryServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let tempMediaRoot: string;

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

async function createUserWithCookie(
  email: string
): Promise<{ agent: ReturnType<typeof request.agent> }> {
  const passwordHash = await hashPassword("password123");
  const user = await UserModel.create({
    email,
    passwordHash,
    name: "Test User",
  });
  const token = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
  });
  const agent = request.agent(app);
  agent.set("Cookie", `${env.cookieName}=${token}`);
  return { agent };
}

async function createWorkspace(agent: ReturnType<typeof request.agent>) {
  const res = await agent
    .post(`${env.apiPrefix}/workspaces`)
    .send({ name: "Media Workspace" })
    .expect(201);
  return res.body.data.id as string;
}

function mediaApi(workspaceId: string) {
  return `${env.apiPrefix}/workspaces/${workspaceId}/media`;
}

describe("Media API", () => {
  before(async () => {
    tempMediaRoot = await fs.mkdtemp(path.join(os.tmpdir(), "safnom-media-"));
    setStorageServiceForTests(new LocalStorageService(tempMediaRoot));
    memoryServer = await MongoMemoryServer.create();
    await mongoose.disconnect();
    await mongoose.connect(memoryServer.getUri());
    app = createApp();
  });

  after(async () => {
    await mongoose.disconnect();
    await memoryServer.stop();
    setStorageServiceForTests(null);
    await fs.rm(tempMediaRoot, { recursive: true, force: true });
  });

  it("uploads image and lists media", async () => {
    const { agent } = await createUserWithCookie("media-up@test.local");
    const wsId = await createWorkspace(agent);

    const upload = await agent
      .post(mediaApi(wsId))
      .attach("file", PNG_1X1, {
        filename: "dot.png",
        contentType: "image/png",
      })
      .expect(201);

    assert.equal(upload.body.data.mimeType, "image/png");
    assert.ok(upload.body.data.url.includes("/content"));

    const list = await agent.get(mediaApi(wsId)).expect(200);
    assert.equal(list.body.data.media.length, 1);
  });

  it("serves content with correct type", async () => {
    const { agent } = await createUserWithCookie("media-content@test.local");
    const wsId = await createWorkspace(agent);

    const upload = await agent
      .post(mediaApi(wsId))
      .attach("file", PNG_1X1, "a.png")
      .expect(201);

    const mediaId = upload.body.data.id as string;
    const res = await agent
      .get(`${mediaApi(wsId)}/${mediaId}/content`)
      .expect(200);
    assert.match(String(res.headers["content-type"]), /image\/png/);
    assert.ok(res.body.length > 0);
  });

  it("replaces media file", async () => {
    const { agent } = await createUserWithCookie("media-replace@test.local");
    const wsId = await createWorkspace(agent);

    const upload = await agent
      .post(mediaApi(wsId))
      .attach("file", PNG_1X1, "old.png")
      .expect(201);
    const mediaId = upload.body.data.id as string;

    const replaced = await agent
      .patch(`${mediaApi(wsId)}/${mediaId}`)
      .attach("file", PNG_1X1, "new.png")
      .expect(200);

    assert.equal(replaced.body.data.originalFilename, "new.png");
  });

  it("deletes media", async () => {
    const { agent } = await createUserWithCookie("media-del@test.local");
    const wsId = await createWorkspace(agent);

    const upload = await agent
      .post(mediaApi(wsId))
      .attach("file", PNG_1X1, "del.png")
      .expect(201);
    const mediaId = upload.body.data.id as string;

    await agent.delete(`${mediaApi(wsId)}/${mediaId}`).expect(200);
    await agent.get(`${mediaApi(wsId)}/${mediaId}`).expect(404);
  });

  it("rejects invalid file type", async () => {
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

  it("denies cross-workspace media access", async () => {
    const a = await createUserWithCookie("media-iso-a@test.local");
    const b = await createUserWithCookie("media-iso-b@test.local");
    const wsA = await createWorkspace(a.agent);
    const wsB = await createWorkspace(b.agent);

    const upload = await a.agent
      .post(mediaApi(wsA))
      .attach("file", PNG_1X1, "secret.png")
      .expect(201);
    const mediaId = upload.body.data.id as string;

    await b.agent.get(`${mediaApi(wsB)}/${mediaId}`).expect(404);
    await b.agent
      .get(`${mediaApi(wsA)}/${mediaId}/content`)
      .expect(404);
  });
});
