import { Types } from "mongoose";
import { AppError } from "../../middleware/error.middleware.js";
import { sendEmail } from "../../services/email/email.service.js";
import { UserModel } from "../users/users.model.js";
import { WebsiteModel } from "../websites/websites.model.js";
import { assertWebsiteInWorkspace } from "../websites/websites.service.js";
import { WorkspaceMemberModel } from "../workspaces/workspace-member.model.js";
import { getWorkspaceBusinessProfile } from "../workspaces/workspaces.service.js";

export interface SubmitInquiryInput {
  name: string;
  email: string;
  message: string;
}

function assertObjectIdString(value: string, label: string): string {
  const id = value.trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400, "VALIDATION_ERROR");
  }
  return id;
}

function workspaceIdFromWebsite(website: { workspaceId?: unknown }): string {
  const raw = website.workspaceId;
  let id = "";
  if (raw instanceof Types.ObjectId) {
    id = raw.toString();
  } else if (typeof raw === "string") {
    id = raw.trim();
  }
  return assertObjectIdString(id || "invalid", "workspace reference");
}

async function resolveInquiryRecipientEmail(
  workspaceId: string
): Promise<string> {
  const wsId = assertObjectIdString(workspaceId, "workspace ID");

  const owner = await WorkspaceMemberModel.findOne({
    workspaceId: wsId,
    role: "OWNER",
  }).lean();

  if (owner?.userId) {
    const userId =
      owner.userId instanceof Types.ObjectId
        ? owner.userId.toString()
        : String(owner.userId);
    if (Types.ObjectId.isValid(userId)) {
      const user = await UserModel.findById(userId).select("email").lean();
      if (user?.email?.trim()) {
        return user.email.trim();
      }
    }
  }

  const profile = await getWorkspaceBusinessProfile(wsId);
  if (profile.email?.trim()) {
    return profile.email.trim();
  }

  throw new AppError(
    "This site cannot receive inquiries yet — add an email on your Safnom account or business profile.",
    503,
    "INQUIRY_RECIPIENT_UNAVAILABLE"
  );
}

async function deliverInquiryEmail(
  workspaceId: string,
  input: SubmitInquiryInput,
  context: { websiteName?: string; sourceLabel?: string }
): Promise<void> {
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

  await sendEmail({ to, subject, text, html, replyTo: input.email });
}

export async function submitInquiryForPublicWebsite(
  publicId: string,
  input: SubmitInquiryInput
): Promise<void> {
  const normalized = publicId.trim().toUpperCase();
  const website = await WebsiteModel.findOne({ publicId: normalized }).lean();
  if (!website) {
    throw new AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
  }

  if (website.status !== "PUBLISHED") {
    throw new AppError(
      "This website is not currently published",
      404,
      "WEBSITE_NOT_PUBLISHED"
    );
  }

  const workspaceId = workspaceIdFromWebsite(website);

  await deliverInquiryEmail(workspaceId, input, {
    websiteName: website.name,
    sourceLabel: "your published site contact form",
  });
}

export async function submitInquiryForWorkspace(
  workspaceId: string,
  input: SubmitInquiryInput,
  options?: { websiteId?: string }
): Promise<void> {
  const wsId = assertObjectIdString(workspaceId, "workspace ID");
  let websiteName: string | undefined;
  if (options?.websiteId?.trim()) {
    const siteId = assertObjectIdString(options.websiteId, "website ID");
    const site = await assertWebsiteInWorkspace(wsId, siteId);
    websiteName = site.name;
  }

  await deliverInquiryEmail(wsId, input, {
    websiteName,
    sourceLabel: "Safnom site preview contact form",
  });
}
