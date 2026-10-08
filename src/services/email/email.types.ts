export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** Shown as Reply-To header (e.g. contact form visitor email). */
  replyTo?: string;
}

export interface EmailProviderInterface {
  send(input: SendEmailInput): Promise<void>;
}
