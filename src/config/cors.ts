import type cors from "cors";
import { env } from "./env.js";

function hostnameFromOrigin(origin: string): string | null {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isAllowedFrontendOrigin(origin: string): boolean {
  const normalized = origin.replace(/\/$/, "");
  if (normalized === env.frontendUrl.replace(/\/$/, "")) {
    return true;
  }

  const hostname = hostnameFromOrigin(origin);
  if (!hostname) return false;

  for (const platform of env.publishPlatformDomains) {
    if (hostname === platform || hostname === `www.${platform}`) {
      return true;
    }
    if (hostname.endsWith(`.${platform}`)) {
      return true;
    }
  }

  return false;
}

export const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedFrontendOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
};
