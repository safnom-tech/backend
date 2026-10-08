import { env } from "../../config/env.js";
import { ConsoleEmailProvider } from "./console.provider.js";
import { NodemailerEmailProvider } from "./nodemailer.provider.js";
import { ResendEmailProvider } from "./resend.provider.js";
import type { EmailProviderInterface, SendEmailInput } from "./email.types.js";

let provider: EmailProviderInterface | null = null;

function getProvider(): EmailProviderInterface {
  if (!provider) {
    switch (env.emailProvider) {
      case "smtp":
        provider = new NodemailerEmailProvider();
        break;
      case "resend":
        provider = new ResendEmailProvider();
        break;
      default:
        provider = new ConsoleEmailProvider();
    }
  }
  return provider;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  await getProvider().send(input);
}
