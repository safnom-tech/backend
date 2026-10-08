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

async function createUserWithCookie(email: string) {
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
    .send({ name: "Pages WS" })
    .expect(201);
  return res.body.data.id as string;
}

async function createWebsite(agent: ReturnType<typeof request.agent>, wsId: string) {
  const res = await agent
    .post(`${env.apiPrefix}/workspaces/${wsId}/websites`)
    .send({ name: "Site One" })
    .expect(201);
  return res.body.data.id as string;
}

function pagesApi(wsId: string, websiteId: string) {
  return `${env.apiPrefix}/workspaces/${wsId}/websites/${websiteId}/pages`;
}

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

describe("Pages API", () => {

  it("creates page with DRAFT status", async () => {
    const { agent } = await createUserWithCookie("page-create@test.local");
    const wsId = await createWorkspace(agent);
    const siteId = await createWebsite(agent, wsId);

    const res = await agent
      .post(pagesApi(wsId, siteId))
      .send({ name: "About Us", pageType: "ABOUT" })
      .expect(201);

    assert.equal(res.body.data.status, "DRAFT");
    assert.equal(res.body.data.pageType, "ABOUT");
    assert.ok(res.body.data.slug);
  });

  it("enforces slug uniqueness per website", async () => {
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

  it("denies cross-workspace page access", async () => {
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
    const pageId = page.body.data.id as string;

    await b.agent.get(`${pagesApi(wsB, siteA)}/${pageId}`).expect(404);
  });

  it("manages sections: add, update, duplicate, reorder, delete", async () => {
    const { agent } = await createUserWithCookie("page-sect@test.local");
    const wsId = await createWorkspace(agent);
    const siteId = await createWebsite(agent, wsId);

    const listed = await agent.get(pagesApi(wsId, siteId)).expect(200);
    const pageId = listed.body.data.pages[0].id as string;

    const hero = await agent
      .post(`${pagesApi(wsId, siteId)}/${pageId}/sections`)
      .send({
        type: "HERO",
        data: { title: "Welcome" },
        settings: { alignment: "center" },
      })
      .expect(201);
    const heroId = hero.body.data.id as string;

    const text = await agent
      .post(`${pagesApi(wsId, siteId)}/${pageId}/sections`)
      .send({ type: "TEXT", data: { body: "Hello" } })
      .expect(201);
    const textId = text.body.data.id as string;

    await agent
      .patch(`${pagesApi(wsId, siteId)}/${pageId}/sections/${heroId}`)
      .send({ data: { title: "Updated" } })
      .expect(200);

    const dup = await agent
      .post(
        `${pagesApi(wsId, siteId)}/${pageId}/sections/${heroId}/duplicate`
      )
      .expect(201);
    assert.notEqual(dup.body.data.id, heroId);

    const reordered = await agent
      .patch(`${pagesApi(wsId, siteId)}/${pageId}/sections/reorder`)
      .send({
        sectionIds: [textId, dup.body.data.id as string, heroId],
      })
      .expect(200);
    assert.equal(reordered.body.data.sections[0].id, textId);

    await agent
      .delete(`${pagesApi(wsId, siteId)}/${pageId}/sections/${heroId}`)
      .expect(200);

    const got = await agent
      .get(`${pagesApi(wsId, siteId)}/${pageId}`)
      .expect(200);
    assert.equal(got.body.data.sections.length, 2);
  });

  it("deletes page", async () => {
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
    assert.equal(list.body.data.pages.length, 1);
    assert.equal(list.body.data.pages[0].slug, "home");
  });
});

describe("Templates API", () => {
  it("lists templates", async () => {
    const { agent } = await createUserWithCookie("tpl-list@test.local");
    const res = await agent.get(`${env.apiPrefix}/templates`).expect(200);
    assert.equal(res.body.data.templates.length, 1);
    assert.equal(res.body.data.templates[0].id, "ocean-crown");
  });

  it("applies template with cloned page and section ids", async () => {
    const { agent } = await createUserWithCookie("tpl-apply@test.local");
    const wsId = await createWorkspace(agent);

    const created = await agent
      .post(`${env.apiPrefix}/workspaces/${wsId}/websites`)
      .send({ name: "From Template", templateId: "ocean-crown" })
      .expect(201);

    assert.ok(created.body.data.theme?.colors);
    assert.match(created.body.data.publicId, /^WEB-/);

    const siteId = created.body.data.id as string;
    const pages = await agent.get(pagesApi(wsId, siteId)).expect(200);
    assert.ok(pages.body.data.pages.length >= 1);

    const detail = await agent
      .get(`${env.apiPrefix}/templates/ocean-crown`)
      .expect(200);

    const templateHome = detail.body.data.pages.find(
      (p: { slug: string }) => p.slug === "home"
    );
    const appliedHome = pages.body.data.pages.find(
      (p: { slug: string }) => p.slug === "home"
    );
    assert.ok(templateHome && appliedHome);
    assert.equal(
      appliedHome.sections.length,
      templateHome.sections.length
    );
    for (const section of appliedHome.sections) {
      assert.match(section.id, /^[a-f\d]{24}$/i);
    }
  });

  it("applies Ocean Crown template with full page design", async () => {
    const { agent } = await createUserWithCookie("tpl-ocean@test.local");
    const wsId = await createWorkspace(agent);

    const created = await agent
      .post(`${env.apiPrefix}/workspaces/${wsId}/websites`)
      .send({
        name: "Ocean Crown",
        templateId: "ocean-crown",
      })
      .expect(201);

    assert.equal(created.body.data.theme?.colors?.primary, "#1a1a1a");
    const siteId = created.body.data.id as string;
    const pages = await agent.get(pagesApi(wsId, siteId)).expect(200);
    assert.equal(pages.body.data.pages.length, 1);
    const home = pages.body.data.pages[0];
    assert.equal(home.sections.length, 7);
    assert.equal(home.sections[0].settings.variant, "logistics");
    assert.equal(home.sections[1].data.title, "Around the World");
    assert.equal(home.sections[2].settings.variant, "serviceCards");
    for (const section of home.sections) {
      assert.match(section.id, /^[a-f\d]{24}$/i);
    }
  });
});
