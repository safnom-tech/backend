import dotenv from "dotenv";
import {
  assertResendEmailFrom,
  normalizeEmailFrom,
} from "../services/email/email-from.util.js";

dotenv.config();

export type NodeEnv = "development" | "production" | "test";
export type EmailProvider = "console" | "smtp" | "resend";
export type AiProviderName = "mock" | "openai";
export type TemplateSource = "code" | "mongo";

export interface EnvConfig {
  nodeEnv: NodeEnv;
  port: number;
  mongodbUri: string;
  frontendUrl: string;
  apiPrefix: string;
  isProduction: boolean;
  jwtSecret: string;
  jwtExpiresIn: string;
  cookieName: string;
  emailProvider: EmailProvider;
  emailFrom: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  resendApiKey: string;
  mediaMaxFileSizeBytes: number;
  mediaStorageDriver: "local";
  mediaLocalRoot: string;
  aiProvider: AiProviderName;
  aiApiKey: string;
  aiModel: string;
  aiTimeoutMs: number;
  aiBaseUrl: string;
  templateSource: TemplateSource;
  redisUrl: string;
  templateCacheTtlSeconds: number;
  firebaseProjectId: string;
  firebaseClientEmail: string;
  firebasePrivateKey: string;
  publishPlatformDomains: string[];
  publishPublicOrigin: string;
}

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!value || Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function parseNodeEnv(value: string | undefined): NodeEnv {
  if (value === "production" || value === "test") {
    return value;
  }
  return "development";
}

function parseAiProvider(value: string | undefined): AiProviderName {
  if (value === "openai") return "openai";
  return "mock";
}

function parseEmailProvider(value: string | undefined): EmailProvider {
  if (value === "smtp") return "smtp";
  if (value === "resend") return "resend";
  return "console";
}

function parseTemplateSource(value: string | undefined): TemplateSource {
  if (value === "mongo") return "mongo";
  return "code";
}

function parsePositiveInt(
  value: string | undefined,
  fallback: number
): number {
  const parsed = Number(value);
  if (!value || Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

/** Normalize service-account private_key from .env (quotes, \\n, trailing commas). */
function parseFirebasePrivateKey(value: string | undefined): string {
  if (!value) return "";

  let key = value.trim().replace(/\\n/g, "\n");

  while (key.startsWith('"') || key.startsWith("'")) {
    key = key.slice(1).trimStart();
  }
  while (key.endsWith('"') || key.endsWith("'") || key.endsWith(",")) {
    key = key.slice(0, -1).trimEnd();
  }

  return key;
}

const nodeEnv = parseNodeEnv(process.env.NODE_ENV);
const isProduction = nodeEnv === "production";

const jwtSecret =
  process.env.JWT_SECRET ??
  (isProduction ? "" : "dev-jwt-secret-change-in-production");

if (isProduction && !jwtSecret) {
  throw new Error("JWT_SECRET is required in production");
}

const emailProvider = parseEmailProvider(process.env.EMAIL_PROVIDER);

function defaultEmailFrom(provider: EmailProvider): string {
  if (provider === "resend") {
    return "Safnom <onboarding@resend.dev>";
  }
  if (provider === "smtp") {
    return "Safnom <safnomtech@gmail.com>";
  }
  return "noreply@safnom.local";
}

const emailFromEnv = process.env.EMAIL_FROM?.trim();
const rawEmailFrom = normalizeEmailFrom(
  emailFromEnv ? emailFromEnv : defaultEmailFrom(emailProvider)
);
const emailFrom =
  emailProvider === "resend"
    ? assertResendEmailFrom(rawEmailFrom)
    : rawEmailFrom;

export const env: EnvConfig = {
  nodeEnv,
  port: parsePort(process.env.PORT, 8080),
  mongodbUri:
    process.env.MONGODB_URI ?? "mongodb://localhost:27017/safnom",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",
  isProduction,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  cookieName: process.env.COOKIE_NAME ?? "safnom_token",
  emailProvider,
  emailFrom,
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: parsePort(process.env.SMTP_PORT, 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  mediaMaxFileSizeBytes: parsePort(process.env.MEDIA_MAX_FILE_SIZE_BYTES, 5_242_880),
  mediaStorageDriver: "local",
  mediaLocalRoot: process.env.MEDIA_LOCAL_ROOT ?? "./data/media",
  aiProvider: parseAiProvider(process.env.AI_PROVIDER),
  aiApiKey: process.env.AI_API_KEY ?? "",
  aiModel: process.env.AI_MODEL ?? "gpt-4o-mini",
  aiTimeoutMs: parsePort(process.env.AI_TIMEOUT_MS, 30_000),
  aiBaseUrl: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
  templateSource: parseTemplateSource(process.env.TEMPLATE_SOURCE),
  redisUrl: process.env.REDIS_URL?.trim() ?? "",
  templateCacheTtlSeconds: parsePositiveInt(
    process.env.TEMPLATE_CACHE_TTL_SECONDS,
    3600
  ),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID?.trim() ?? "",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim() ?? "",
  firebasePrivateKey: parseFirebasePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  publishPlatformDomains: (() => {
    const parsed = (process.env.PUBLISH_PLATFORM_DOMAINS ??
      process.env.PUBLISH_BASE_DOMAIN ??
      "safnom.site")
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    return parsed.length > 0 ? parsed : ["safnom.site"];
  })(),
  publishPublicOrigin:
    process.env.PUBLISH_PUBLIC_ORIGIN?.trim() ||
    process.env.FRONTEND_URL?.trim() ||
    "http://localhost:3000",
};

if (isProduction && env.emailProvider === "resend" && !env.resendApiKey) {
  throw new Error(
    "RESEND_API_KEY is required in production when EMAIL_PROVIDER=resend"
  );
}
