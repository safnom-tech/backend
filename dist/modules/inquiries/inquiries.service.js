"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitInquiryForPublicWebsite = submitInquiryForPublicWebsite;
exports.submitInquiryForWorkspace = submitInquiryForWorkspace;
const mongoose_1 = require("mongoose");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const email_service_js_1 = require("../../services/email/email.service.js");
const users_model_js_1 = require("../users/users.model.js");
const websites_model_js_1 = require("../websites/websites.model.js");
const websites_service_js_1 = require("../websites/websites.service.js");
const workspace_member_model_js_1 = require("../workspaces/workspace-member.model.js");
const workspaces_service_js_1 = require("../workspaces/workspaces.service.js");
function assertObjectIdString(value, label) {
    const id = value.trim();
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new error_middleware_js_1.AppError(`Invalid ${label}`, 400, "VALIDATION_ERROR");
    }
    return id;
}
function workspaceIdFromWebsite(website) {
    const raw = website.workspaceId;
    let id = "";
    if (raw instanceof mongoose_1.Types.ObjectId) {
        id = raw.toString();
    }
    else if (typeof raw === "string") {
        id = raw.trim();
    }
    return assertObjectIdString(id || "invalid", "workspace reference");
}
async function resolveInquiryRecipientEmail(workspaceId) {
    const wsId = assertObjectIdString(workspaceId, "workspace ID");
    const owner = await workspace_member_model_js_1.WorkspaceMemberModel.findOne({
        workspaceId: wsId,
        role: "OWNER",
    }).lean();
    if (owner?.userId) {
        const userId = owner.userId instanceof mongoose_1.Types.ObjectId
            ? owner.userId.toString()
            : String(owner.userId);
        if (mongoose_1.Types.ObjectId.isValid(userId)) {
            const user = await users_model_js_1.UserModel.findById(userId).select("email").lean();
            if (user?.email?.trim()) {
                return user.email.trim();
            }
        }
    }
    const profile = await (0, workspaces_service_js_1.getWorkspaceBusinessProfile)(wsId);
    if (profile.email?.trim()) {
        return profile.email.trim();
    }
    throw new error_middleware_js_1.AppError("This site cannot receive inquiries yet — add an email on your Safnom account or business profile.", 503, "INQUIRY_RECIPIENT_UNAVAILABLE");
}
async function deliverInquiryEmail(workspaceId, input, context) {
    const to = await resolveInquiryRecipientEmail(workspaceId);
    const sitePart = context.websiteName?.trim()
        ? ` — ${context.websiteName.trim()}`
        : "";
    const subject = `New website inquiry${sitePart}`;
    const source = context.sourceLabel?.trim() ?? "Website contact form";
    const text = [
        `You received a new message via ${source}.`,
        context.websiteName ? `Website: ${context.websiteName}` : "",
        "",
        `From: ${input.name}`,
        `Reply-to: ${input.email}`,
        "",
        input.message,
    ]
        .filter(Boolean)
        .join("\n");
    const html = `
    <p>You received a new message via ${source}.</p>
    ${context.websiteName ? `<p><strong>Website:</strong> ${context.websiteName}</p>` : ""}
    <p><strong>From:</strong> ${input.name}<br/>
    <strong>Reply-to:</strong> <a href="mailto:${input.email}">${input.email}</a></p>
    <pre style="white-space:pre-wrap;font-family:inherit">${input.message.replace(/</g, "&lt;")}</pre>
  `;
    await (0, email_service_js_1.sendEmail)({ to, subject, text, html, replyTo: input.email });
}
async function submitInquiryForPublicWebsite(publicId, input) {
    const normalized = publicId.trim().toUpperCase();
    const website = await websites_model_js_1.WebsiteModel.findOne({ publicId: normalized }).lean();
    if (!website) {
        throw new error_middleware_js_1.AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
    }
    if (website.status !== "PUBLISHED") {
        throw new error_middleware_js_1.AppError("This website is not currently published", 404, "WEBSITE_NOT_PUBLISHED");
    }
    const workspaceId = workspaceIdFromWebsite(website);
    await deliverInquiryEmail(workspaceId, input, {
        websiteName: website.name,
        sourceLabel: "your published site contact form",
    });
}
async function submitInquiryForWorkspace(workspaceId, input, options) {
    const wsId = assertObjectIdString(workspaceId, "workspace ID");
    let websiteName;
    if (options?.websiteId?.trim()) {
        const siteId = assertObjectIdString(options.websiteId, "website ID");
        const site = await (0, websites_service_js_1.assertWebsiteInWorkspace)(wsId, siteId);
        websiteName = site.name;
    }
    await deliverInquiryEmail(wsId, input, {
        websiteName,
        sourceLabel: "Safnom site preview contact form",
    });
}
