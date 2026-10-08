import { Router } from "express";
import { authRoutes } from "../../modules/auth/index.js";
import { usersRoutes } from "../../modules/users/index.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireWorkspaceParamAccess } from "../../middleware/workspace.middleware.js";
import { workspacesRoutes } from "../../modules/workspaces/index.js";
import { websitesRoutes } from "../../modules/websites/index.js";
import { mediaRoutes } from "../../modules/media/index.js";
import { aiRoutes } from "../../modules/ai/index.js";
import { domainsRoutes } from "../../modules/domains/index.js";
import {
  publicPublishingRoutes,
  publishingWebsiteRoutes,
} from "../../modules/publishing/index.js";
import { templatesRoutes } from "../../modules/templates/index.js";
import { workspaceTemplatesRoutes } from "../../modules/templates/workspace-templates.routes.js";
import { healthRouter } from "./health.routes.js";
import {
  publicInquiriesRoutes,
  workspaceInquiriesRoutes,
} from "../../modules/inquiries/index.js";

const v1Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/public", publicInquiriesRoutes);
v1Router.use("/public", publicPublishingRoutes);
v1Router.use("/auth", authRoutes);
v1Router.use("/users", usersRoutes);
v1Router.use(
  "/workspaces/:workspaceId/inquiries",
  requireAuth,
  requireWorkspaceParamAccess,
  workspaceInquiriesRoutes
);
v1Router.use("/workspaces", workspacesRoutes);
v1Router.use(
  "/workspaces/:workspaceId/websites",
  requireAuth,
  requireWorkspaceParamAccess,
  publishingWebsiteRoutes
);
v1Router.use(
  "/workspaces/:workspaceId/websites",
  requireAuth,
  requireWorkspaceParamAccess,
  websitesRoutes
);
v1Router.use("/templates", templatesRoutes);
v1Router.use(
  "/workspaces/:workspaceId/templates",
  requireAuth,
  requireWorkspaceParamAccess,
  workspaceTemplatesRoutes
);
v1Router.use(
  "/workspaces/:workspaceId/media",
  requireAuth,
  requireWorkspaceParamAccess,
  mediaRoutes
);
v1Router.use(
  "/workspaces/:workspaceId/ai",
  requireAuth,
  requireWorkspaceParamAccess,
  aiRoutes
);
v1Router.use("/domains", domainsRoutes);

export { v1Router };
