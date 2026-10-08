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
import { setMockAiBehavior } from "./providers/mock.provider.js";
import { parseJsonFromModelText } from "./utils/ai-response-parser.js";
import { validateSectionData } from "./ai.validation.js";

let memoryServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;

async function createUserWithCookie(email: string) {
  const passwordHash = await hashPassword("password123");
  const user = await UserModel.create({
    email,
    passwordHash,
    name: "Test User",
  });
  const token = signAccessToken({ sub: user._id.toString(), email: user.email });
  const agent = request.agent(app);
  agent.set("Cookie", `${env.cookieName}=${token}`);
  return { agent };
}

async function createWorkspace(agent: ReturnType<typeof request.agent>) {
  const res = await agent
    .post(`${env.apiPrefix}/workspaces`)
    .send({ name: "AI Workspace" })
    .expect(201);
  return res.body.data.id as string;
}

async function getHomePageId(
  agent: ReturnType<typeof request.agent>,
  wsId: string,
  websiteId: string
) {
  const pages = await agent
    .get(`${env.apiPrefix}/workspaces/${wsId}/websites/${websiteId}/pages`)
    .expect(200);
  const home =
    pages.body.data.pages.find((p: { slug: string }) => p.slug === "home") ??
    pages.body.data.pages[0];
  return home.id as string;
}

function aiApi(workspaceId: string) {
  return `${env.apiPrefix}/workspaces/${workspaceId}/ai`;
}

describe("AI utilities", () => {
  it("parses fenced JSON", () => {
    const v = parseJsonFromModelText('```json\n{"a":1}\n```');
    assert.deepEqual(v, { a: 1 });
  });

  it("rejects unsafe section strings", () => {
    assert.throws(() =>
      validateSectionData("HERO", {
        title: "<script>alert(1)</script>",
      })
    );
  });
});

describe("AI API", () => {
  before(async () => {
    setMockAiBehavior("normal");
    memoryServer = await MongoMemoryServer.create();
    await mongoose.disconnect();
    await mongoose.connect(memoryServer.getUri());
    app = createApp();
  });

  after(async () => {
    setMockAiBehavior("normal");
    await mongoose.disconnect();
    await memoryServer.stop();
  });

  it("generates website draft from business info", async () => {
    const { agent } = await createUserWithCookie("ai-web@test.local");
    const wsId = await createWorkspace(agent);

    const res = await agent
      .post(`${aiApi(wsId)}/website/generate`)
      .send({
        businessName: "ABC Dental Clinic",
        businessType: "Dental Clinic",
        businessDescription: "Family dental care in Pune.",
        location: "Pune, Maharashtra",
        services: ["Cleaning", "Implants"],
        websiteStyle: "Modern and professional",
      })
      .expect(201);

    assert.equal(res.body.data.website.name, "ABC Dental Clinic");
    assert.ok(res.body.data.pages.length >= 1);
    assert.ok(res.body.data.pages[0].sections.length >= 3);
  });

  it("returns section rewrite suggestion", async () => {
    const { agent } = await createUserWithCookie("ai-section@test.local");
    const wsId = await createWorkspace(agent);

    const site = await agent
      .post(`${env.apiPrefix}/workspaces/${wsId}/websites`)
      .send({ name: "AI Site" })
      .expect(201);
    const websiteId = site.body.data.id as string;
    const pageId = await getHomePageId(agent, wsId, websiteId);

    const section = await agent
      .post(
        `${env.apiPrefix}/workspaces/${wsId}/websites/${websiteId}/pages/${pageId}/sections`
      )
      .send({
        type: "HERO",
        data: { title: "Hello", description: "Old text" },
      })
      .expect(201);
    const sectionId = section.body.data.id as string;

    const ai = await agent
      .post(`${aiApi(wsId)}/section/action`)
      .send({
        action: "rewrite",
        websiteId,
        pageId,
        sectionId,
        sectionType: "HERO",
        content: { title: "Hello", description: "Old text" },
      })
      .expect(200);

    assert.ok(ai.body.data.data.title);
  });

  it("creates section draft from prompt", async () => {
    const { agent } = await createUserWithCookie("ai-create-sec@test.local");
    const wsId = await createWorkspace(agent);
    const site = await agent
      .post(`${env.apiPrefix}/workspaces/${wsId}/websites`)
      .send({ name: "Prompt Site" })
      .expect(201);
    const websiteId = site.body.data.id as string;
    const pageId = await getHomePageId(agent, wsId, websiteId);

    const res = await agent
      .post(`${aiApi(wsId)}/section/action`)
      .send({
        action: "create_from_prompt",
        websiteId,
        pageId,
        prompt: "Add an FAQ section about our hours and location",
        businessContext: { businessName: "Prompt Site" },
      })
      .expect(200);

    assert.equal(res.body.data.type, "COMPOSED");
    assert.ok(res.body.data.data.section);
    assert.ok(res.body.data.data.section.root);
  });

  it("generates composed section via dedicated endpoint", async () => {
    const { agent } = await createUserWithCookie("ai-composed@test.local");
    const wsId = await createWorkspace(agent);
    const site = await agent
      .post(`${env.apiPrefix}/workspaces/${wsId}/websites`)
      .send({ name: "Composed Site" })
      .expect(201);
    const websiteId = site.body.data.id as string;
    const pageId = await getHomePageId(agent, wsId, websiteId);

    const res = await agent
      .post(`${aiApi(wsId)}/sections/generate`)
      .send({
        websiteId,
        pageId,
        prompt:
          "Create a premium About Me section with profile image, experience stats, skills, and a contact button.",
        designStyle: "premium",
        sectionTypeHint: "about",
      })
      .expect(200);

    assert.equal(res.body.data.type, "COMPOSED");
    assert.equal(res.body.data.section.semanticType, "about");
    assert.equal(res.body.data.data.schemaVersion, 1);
  });

  it("creates premium hero from banner prompt", async () => {
    const { agent } = await createUserWithCookie("ai-hero-prompt@test.local");
    const wsId = await createWorkspace(agent);
    const site = await agent
      .post(`${env.apiPrefix}/workspaces/${wsId}/websites`)
      .send({ name: "Hero Co" })
      .expect(201);
    const websiteId = site.body.data.id as string;
    const pageId = await getHomePageId(agent, wsId, websiteId);

    const res = await agent
      .post(`${aiApi(wsId)}/section/action`)
      .send({
        action: "create_from_prompt",
        websiteId,
        pageId,
        prompt:
          "Modern Banner/Hero with 2-column layout, image right, primary and secondary CTA",
        businessContext: { businessName: "Hero Co", businessType: "SaaS" },
      })
      .expect(200);

    assert.equal(res.body.data.type, "COMPOSED");
    assert.ok(res.body.data.data.section?.root);
  });

  it("returns SEO suggestion", async () => {
    const { agent } = await createUserWithCookie("ai-seo@test.local");
    const wsId = await createWorkspace(agent);
    const site = await agent
      .post(`${env.apiPrefix}/workspaces/${wsId}/websites`)
      .send({ name: "SEO Site" })
      .expect(201);
    const websiteId = site.body.data.id as string;
    const pageId = await getHomePageId(agent, wsId, websiteId);

    const res = await agent
      .post(`${aiApi(wsId)}/section/action`)
      .send({
        action: "seo_title",
        websiteId,
        pageId,
        businessContext: { businessName: "SEO Site" },
      })
      .expect(200);

    assert.ok(res.body.data.seo.title);
  });

  it("rejects invalid mock AI JSON", async () => {
    setMockAiBehavior("bad_json");
    const { agent } = await createUserWithCookie("ai-bad@test.local");
    const wsId = await createWorkspace(agent);

    await agent
      .post(`${aiApi(wsId)}/website/generate`)
      .send({
        businessName: "Bad Co",
        businessType: "Shop",
        businessDescription: "Test business description here.",
        location: "City",
        services: ["One"],
        websiteStyle: "Simple",
      })
      .expect(400);

    setMockAiBehavior("normal");
  });

  it("denies cross-workspace AI access", async () => {
    const a = await createUserWithCookie("ai-iso-a@test.local");
    const b = await createUserWithCookie("ai-iso-b@test.local");
    const wsA = await createWorkspace(a.agent);
    const wsB = await createWorkspace(b.agent);

    const site = await a.agent
      .post(`${env.apiPrefix}/workspaces/${wsA}/websites`)
      .send({ name: "Private" })
      .expect(201);
    const websiteId = site.body.data.id as string;
    const pageId = await getHomePageId(a.agent, wsA, websiteId);

    await b.agent
      .post(`${aiApi(wsB)}/section/action`)
      .send({
        action: "seo_title",
        websiteId,
        pageId,
      })
      .expect(404);
  });
});
