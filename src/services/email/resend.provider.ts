import { Resend } from "resend";
import { env } from "../../config/env.js";
import { AppError } from "../../middleware/error.middleware.js";
import { normalizeReplyTo } from "./email-from.util.js";
import type { EmailProviderInterface, SendEmailInput } from "./email.types.js";

export class ResendEmailProvider implements EmailProviderInterface {
  private client: Resend;

  constructor() {
    if (!env.resendApiKey) {
      throw new AppError(
        "RESEND_API_KEY is required when EMAIL_PROVIDER=resend",
        500,
        "EMAIL_CONFIG_ERROR"
      );
    }
    this.client = new Resend(env.resendApiKey);
  }

  async send(input: SendEmailInput): Promise<void> {
    const replyTo = normalizeReplyTo(input.replyTo);
    const { error } = await this.client.emails.send({
      from: env.emailFrom,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      throw new AppError(
        error.message ?? "Failed to send email via Resend",
        502,
        "EMAIL_SEND_FAILED"
      );
    }
  }
}
