import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../../app.js";
import { env } from "../../config/env.js";
import { hashPassword } from "../../utils/password.js";
import { signAccessToken } from "../../utils/jwt.js";
import { UserModel } from "../users/users.model.js";

const API = `${env.apiPrefix}/workspaces`;

let memoryServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;

async function createUserWithCookie(
  email: string
): Promise<{ userId: string; agent: ReturnType<typeof request.agent> }> {
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
  return { userId: user._id.toString(), agent };
}

describe("Workspaces API", () => {
  before(async () => {
    memoryServer = await MongoMemoryServer.create();
    await mongoose.disconnect();
    await mongoose.connect(memoryServer.getUri());
    app = createApp();
  });

  after(async () => {
    await mongoose.disconnect();
    await memoryServer.stop();
  });

  it("creates workspace and assigns OWNER membership", async () => {
    const { agent } = await createUserWithCookie("owner-a@test.local");

    const res = await agent
      .post(API)
      .send({ name: "Acme Business" })
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.name, "Acme Business");
    assert.match(res.body.data.slug, /^acme-business/);

    const current = await agent.get(`${API}/current`).expect(200);
    assert.equal(current.body.data.workspace.id, res.body.data.id);
  });

  it("lists only workspaces the user belongs to", async () => {
    const userA = await createUserWithCookie("list-a@test.local");
    const userB = await createUserWithCookie("list-b@test.local");

    const wsA = await userA.agent
      .post(API)
      .send({ name: "Workspace A" })
      .expect(201);
    await userB.agent.post(API).send({ name: "Workspace B" }).expect(201);

    const listA = await userA.agent.get(API).expect(200);
    assert.equal(listA.body.data.workspaces.length, 1);
    assert.equal(listA.body.data.workspaces[0].id, wsA.body.data.id);

    const listB = await userB.agent.get(API).expect(200);
    assert.equal(listB.body.data.workspaces.length, 1);
    assert.notEqual(listB.body.data.workspaces[0].id, wsA.body.data.id);
  });

  it("denies cross-workspace access with 404", async () => {
    const userA = await createUserWithCookie("iso-a@test.local");
    const userB = await createUserWithCookie("iso-b@test.local");

    const wsB = await userB.agent
      .post(API)
      .send({ name: "Secret B" })
      .expect(201);
    const workspaceBId = wsB.body.data.id as string;

    await userA.agent.get(`${API}/${workspaceBId}`).expect(404);
    await userA.agent
      .patch(`${API}/${workspaceBId}`)
      .send({ name: "Hacked" })
      .expect(404);
    await userA.agent.post(`${API}/${workspaceBId}/select`).expect(404);
  });

  it("switches current workspace", async () => {
    const { agent } = await createUserWithCookie("switch@test.local");

    const ws1 = await agent.post(API).send({ name: "First" }).expect(201);
    const ws2 = await agent.post(API).send({ name: "Second" }).expect(201);

    await agent.post(`${API}/${ws1.body.data.id}/select`).expect(200);
    let current = await agent.get(`${API}/current`).expect(200);
    assert.equal(current.body.data.workspace.id, ws1.body.data.id);

    await agent.post(`${API}/${ws2.body.data.id}/select`).expect(200);
    current = await agent.get(`${API}/current`).expect(200);
    assert.equal(current.body.data.workspace.id, ws2.body.data.id);
  });

  it("updates workspace name for member", async () => {
    const { agent } = await createUserWithCookie("patch@test.local");
    const created = await agent
      .post(API)
      .send({ name: "Old Name" })
      .expect(201);

    const updated = await agent
      .patch(`${API}/${created.body.data.id}`)
      .send({ name: "New Name" })
      .expect(200);

    assert.equal(updated.body.data.name, "New Name");
  });

  it("rejects duplicate slug with 409", async () => {
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

    assert.equal(dup.body.error.code, "WORKSPACE_SLUG_TAKEN");
  });
});
