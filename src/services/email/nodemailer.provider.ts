import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import { AppError } from "../../middleware/error.middleware.js";
import type { EmailProviderInterface, SendEmailInput } from "./email.types.js";

export class NodemailerEmailProvider implements EmailProviderInterface {
  private transporter;

  constructor() {
    if (!env.smtpHost) {
      throw new AppError(
        "SMTP_HOST is required when EMAIL_PROVIDER=smtp",
        500,
        "EMAIL_CONFIG_ERROR"
      );
    }
    this.transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth:
        env.smtpUser && env.smtpPass
          ? { user: env.smtpUser, pass: env.smtpPass }
          : undefined,
    });
  }

  async send(input: SendEmailInput): Promise<void> {
    await this.transporter.sendMail({
      from: env.emailFrom,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });
  }
}
