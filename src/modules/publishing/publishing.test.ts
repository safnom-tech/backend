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

function publicSiteApi(subdomain: string) {
  return `${env.apiPrefix}/public/sites/${subdomain}`;
}

describe("Publishing API", () => {
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

  it("rejects PATCH status bypass", async () => {
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

  it("publishes website and serves public snapshot", async () => {
    const { agent } = await createUserWithCookie("pub-live@test.local");
    const wsId = await createWorkspace(agent);
    const created = await agent
      .post(websitesApi(wsId))
      .send({ name: "ABC Shop" })
      .expect(201);
    const siteId = created.body.data.id as string;

    await agent
      .post(`${websitesApi(wsId)}/${siteId}/publish`)
      .send({ subdomain: "abc-shop-pub" })
      .expect(200);

    const pub = await request(app)
      .get(publicSiteApi("abc-shop-pub"))
      .expect(200);

    assert.match(pub.body.data.website.name, /ABC Shop/);
    assert.ok(pub.body.data.page.sections.length >= 0);
  });

  it("keeps public content when draft changes without republish", async () => {
    const { agent } = await createUserWithCookie("pub-draft-iso@test.local");
    const wsId = await createWorkspace(agent);
    const created = await agent
      .post(websitesApi(wsId))
      .send({ name: "Welcome ABC" })
      .expect(201);
    const siteId = created.body.data.id as string;

    const pages = await agent
      .get(`${websitesApi(wsId)}/${siteId}/pages`)
      .expect(200);
    const homeId = pages.body.data.pages[0].id as string;

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

    const live = await request(app)
      .get(publicSiteApi("draft-iso-site"))
      .expect(200);
    assert.equal(live.body.data.page.seo.title, "Welcome ABC");

    await agent.post(`${websitesApi(wsId)}/${siteId}/publish`).expect(200);

    const live2 = await request(app)
      .get(publicSiteApi("draft-iso-site"))
      .expect(200);
    assert.equal(live2.body.data.page.seo.title, "Welcome XYZ");
  });

  it("unpublish stops public access", async () => {
    const { agent } = await createUserWithCookie("pub-unpub@test.local");
    const wsId = await createWorkspace(agent);
    const created = await agent
      .post(websitesApi(wsId))
      .send({ name: "Temp Live" })
      .expect(201);
    const siteId = created.body.data.id as string;

    await agent
      .post(`${websitesApi(wsId)}/${siteId}/publish`)
      .send({ subdomain: "temp-live-site" })
      .expect(200);

    await agent
      .post(`${websitesApi(wsId)}/${siteId}/unpublish`)
      .expect(200);

    await request(app).get(publicSiteApi("temp-live-site")).expect(404);
  });

  it("rejects reserved subdomain", async () => {
    const { agent } = await createUserWithCookie("pub-reserved@test.local");
    const wsId = await createWorkspace(agent);
    const created = await agent
      .post(websitesApi(wsId))
      .send({ name: "Admin Site" })
      .expect(201);
    const siteId = created.body.data.id as string;

    const res = await agent
      .post(`${websitesApi(wsId)}/${siteId}/publish`)
      .send({ subdomain: "admin" })
      .expect(400);

    assert.equal(res.body.error.code, "SUBDOMAIN_RESERVED");
  });

  it("rejects duplicate subdomain", async () => {
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
    const siteBId = siteB.body.data.websites[0].id as string;

    const res = await b.agent
      .post(`${websitesApi(wsB)}/${siteBId}/publish`)
      .send({ subdomain: "shared-name" })
      .expect(409);

    assert.equal(res.body.error.code, "SUBDOMAIN_TAKEN");
  });

  it("denies cross-workspace publish", async () => {
    const a = await createUserWithCookie("pub-xws-a@test.local");
    const b = await createUserWithCookie("pub-xws-b@test.local");
    const wsA = await createWorkspace(a.agent);
    const wsB = await createWorkspace(b.agent);

    const site = await a.agent
      .post(websitesApi(wsA))
      .send({ name: "Private" })
      .expect(201);
    const siteId = site.body.data.id as string;

    await b.agent
      .post(`${websitesApi(wsB)}/${siteId}/publish`)
      .send({ subdomain: "hack-site" })
      .expect(404);
  });

  it("serves multiple page slugs from snapshot", async () => {
    const { agent } = await createUserWithCookie("pub-pages@test.local");
    const wsId = await createWorkspace(agent);
    const created = await agent
      .post(websitesApi(wsId))
      .send({ name: "Multi Page" })
      .expect(201);
    const siteId = created.body.data.id as string;

    await agent
      .post(`${websitesApi(wsId)}/${siteId}/pages`)
      .send({ name: "About Us", slug: "about", pageType: "ABOUT" })
      .expect(201);

    await agent
      .post(`${websitesApi(wsId)}/${siteId}/publish`)
      .send({ subdomain: "multi-page-site" })
      .expect(200);

    const about = await request(app)
      .get(`${publicSiteApi("multi-page-site")}?pageSlug=about`)
      .expect(200);
    assert.equal(about.body.data.page.slug, "about");
  });
});
