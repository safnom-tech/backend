import { logger } from "../../utils/logger.js";
import type { EmailProviderInterface, SendEmailInput } from "./email.types.js";

export class ConsoleEmailProvider implements EmailProviderInterface {
  async send(input: SendEmailInput): Promise<void> {
    logger.info(
      {
        to: input.to,
        subject: input.subject,
        replyTo: input.replyTo,
        text: input.text,
      },
      "Email (console provider)"
    );
  }
}
