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

let memoryServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;

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
    .send({ name: "Test Workspace" })
    .expect(201);
  return res.body.data.id as string;
}

function websitesApi(workspaceId: string) {
  return `${env.apiPrefix}/workspaces/${workspaceId}/websites`;
}

describe("Websites API", () => {
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

  it("creates website with DRAFT status", async () => {
    const { agent } = await createUserWithCookie("web-create@test.local");
    const wsId = await createWorkspace(agent);

    const res = await agent
      .post(websitesApi(wsId))
      .send({ name: "My Shop", description: "Local store" })
      .expect(201);

    assert.equal(res.body.data.status, "DRAFT");
    assert.equal(res.body.data.name, "My Shop");
    assert.equal(res.body.data.workspaceId, wsId);
    assert.match(res.body.data.publicId, /^WEB-[2-9A-HJ-NP-Z]{6}$/);
    assert.match(res.body.data.subscriptionId, /^SAF-[2-9A-HJ-NP-Z]{6}$/);
    assert.notEqual(res.body.data.publicId, res.body.data.id);
  });

  it("keeps public identity stable after website update", async () => {
    const { agent } = await createUserWithCookie("web-id-stable@test.local");
    const wsId = await createWorkspace(agent);
    const created = await agent
      .post(websitesApi(wsId))
      .send({ name: "Stable ID Site" })
      .expect(201);

    const publicId = created.body.data.publicId as string;
    const subscriptionId = created.body.data.subscriptionId as string;

    const updated = await agent
      .patch(`${websitesApi(wsId)}/${created.body.data.id}`)
      .send({ name: "Renamed Site", description: "Updated copy" })
      .expect(200);

    assert.equal(updated.body.data.publicId, publicId);
    assert.equal(updated.body.data.subscriptionId, subscriptionId);
    assert.equal(updated.body.data.name, "Renamed Site");
  });

  it("assigns unique publicIds across websites", async () => {
    const { agent } = await createUserWithCookie("web-id-unique@test.local");
    const wsId = await createWorkspace(agent);
    const a = await agent
      .post(websitesApi(wsId))
      .send({ name: "Site A Unique" })
      .expect(201);
    const b = await agent
      .post(websitesApi(wsId))
      .send({ name: "Site B Unique" })
      .expect(201);

    assert.notEqual(a.body.data.publicId, b.body.data.publicId);
    assert.notEqual(a.body.data.subscriptionId, b.body.data.subscriptionId);
  });

  it("lists only websites in the workspace", async () => {
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
    assert.equal(listA.body.data.websites.length, 1);
    assert.equal(listA.body.data.websites[0].id, created.body.data.id);
  });

  it("denies cross-workspace website access", async () => {
    const a = await createUserWithCookie("web-iso-a@test.local");
    const b = await createUserWithCookie("web-iso-b@test.local");
    const wsA = await createWorkspace(a.agent);
    const wsB = await createWorkspace(b.agent);

    const site = await a.agent
      .post(websitesApi(wsA))
      .send({ name: "Secret" })
      .expect(201);
    const siteId = site.body.data.id as string;

    await b.agent.get(`${websitesApi(wsB)}/${siteId}`).expect(404);
    await b.agent
      .patch(`${websitesApi(wsB)}/${siteId}`)
      .send({ name: "Hack" })
      .expect(404);
    await b.agent.delete(`${websitesApi(wsB)}/${siteId}`).expect(404);
  });

  it("rejects direct status PATCH (use publish API)", async () => {
    const { agent } = await createUserWithCookie("web-patch@test.local");
    const wsId = await createWorkspace(agent);
    const created = await agent
      .post(websitesApi(wsId))
      .send({ name: "Patch Me" })
      .expect(201);

    await agent
      .patch(`${websitesApi(wsId)}/${created.body.data.id}`)
      .send({ status: "PUBLISHED" })
      .expect(400);
  });

  it("updates website theme", async () => {
    const { agent } = await createUserWithCookie("web-theme@test.local");
    const wsId = await createWorkspace(agent);
    const created = await agent
      .post(websitesApi(wsId))
      .send({ name: "Themed Site" })
      .expect(201);

    const siteId = created.body.data.id as string;
    await agent
      .patch(`${websitesApi(wsId)}/${siteId}`)
      .send({
        theme: {
          colors: { primary: "#ff0000", text: "#111111" },
        },
      })
      .expect(200);

    const got = await agent.get(`${websitesApi(wsId)}/${siteId}`).expect(200);
    assert.equal(got.body.data.theme.colors.primary, "#ff0000");
    assert.equal(got.body.data.theme.colors.text, "#111111");
  });

  it("returns website preview with theme, pages, and SEO", async () => {
    const { agent } = await createUserWithCookie("web-preview@test.local");
    const wsId = await createWorkspace(agent);
    const created = await agent
      .post(websitesApi(wsId))
      .send({ name: "Preview Site" })
      .expect(201);
    const siteId = created.body.data.id as string;

    await agent
      .patch(`${websitesApi(wsId)}/${siteId}`)
      .send({ theme: { colors: { primary: "#00aa88" } } })
      .expect(200);

    const pages = await agent
      .get(`${websitesApi(wsId)}/${siteId}/pages`)
      .expect(200);
    const homeId = pages.body.data.pages[0].id as string;

    await agent
      .patch(`${websitesApi(wsId)}/${siteId}/pages/${homeId}`)
      .send({
        seo: {
          title: "Preview Title",
          metaDescription: "Preview description for SEO",
        },
      })
      .expect(200);

    await agent
      .post(`${websitesApi(wsId)}/${siteId}/pages`)
      .send({ name: "About", slug: "about", pageType: "ABOUT" })
      .expect(201);

    const preview = await agent
      .get(`${websitesApi(wsId)}/${siteId}/preview`)
      .expect(200);

    assert.equal(preview.body.data.website.id, siteId);
    assert.equal(preview.body.data.website.theme.colors.primary, "#00aa88");
    assert.equal(preview.body.data.page.slug, "home");
    assert.equal(preview.body.data.page.seo.title, "Preview Title");
    assert.equal(preview.body.data.pages.length, 2);

    const about = await agent
      .get(`${websitesApi(wsId)}/${siteId}/preview?slug=about`)
      .expect(200);
    assert.equal(about.body.data.page.slug, "about");

    await agent
      .get(`${websitesApi(wsId)}/${siteId}/preview?slug=missing`)
      .expect(404);
  });

  it("denies cross-workspace preview", async () => {
    const a = await createUserWithCookie("web-prev-a@test.local");
    const b = await createUserWithCookie("web-prev-b@test.local");
    const wsA = await createWorkspace(a.agent);
    const wsB = await createWorkspace(b.agent);

    const site = await a.agent
      .post(websitesApi(wsA))
      .send({ name: "Private Preview" })
      .expect(201);
    const siteId = site.body.data.id as string;

    await b.agent.get(`${websitesApi(wsB)}/${siteId}/preview`).expect(404);
  });

  it("deletes website", async () => {
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
    assert.equal(list.body.data.websites.length, 0);
  });
});
