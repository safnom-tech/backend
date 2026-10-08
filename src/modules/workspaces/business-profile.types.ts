export interface WorkspaceBusinessProfile {
  businessName?: string;
  tagline?: string;
  logoUrl?: string | null;
  phone?: string;
  email?: string;
  address?: string;
  socialTwitter?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialLinkedin?: string;
}

export function emptyBusinessProfile(): WorkspaceBusinessProfile {
  return {};
}

export function normalizeBusinessProfile(
  raw: unknown
): WorkspaceBusinessProfile {
  if (!raw || typeof raw !== "object") {
    return emptyBusinessProfile();
  }
  const o = raw as Record<string, unknown>;
  const str = (key: string) => {
    const v = o[key];
    return typeof v === "string" ? v.trim() : undefined;
  };
  return {
    businessName: str("businessName"),
    tagline: str("tagline"),
    logoUrl: str("logoUrl") ?? null,
    phone: str("phone"),
    email: str("email"),
    address: str("address"),
    socialTwitter: str("socialTwitter"),
    socialFacebook: str("socialFacebook"),
    socialInstagram: str("socialInstagram"),
    socialLinkedin: str("socialLinkedin"),
  };
}

export function businessProfileHasName(
  profile: WorkspaceBusinessProfile
): boolean {
  return Boolean(profile.businessName?.trim());
}

function socialLabel(url: string, fallback: string): string {
  const u = url.trim();
  if (!u) return "";
  try {
    const host = new URL(u.startsWith("http") ? u : `https://${u}`).hostname;
    if (host.includes("twitter") || host.includes("x.com")) return "Twitter";
    if (host.includes("facebook")) return "Facebook";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("linkedin")) return "LinkedIn";
  } catch {
    // ignore
  }
  return fallback;
}

/** Footer-friendly line e.g. "Twitter · Facebook · Instagram" */
export function formatSocialLine(profile: WorkspaceBusinessProfile): string {
  const parts: string[] = [];
  if (profile.socialTwitter?.trim()) {
    parts.push(socialLabel(profile.socialTwitter, "Twitter"));
  }
  if (profile.socialFacebook?.trim()) {
    parts.push(socialLabel(profile.socialFacebook, "Facebook"));
  }
  if (profile.socialInstagram?.trim()) {
    parts.push(socialLabel(profile.socialInstagram, "Instagram"));
  }
  if (profile.socialLinkedin?.trim()) {
    parts.push(socialLabel(profile.socialLinkedin, "LinkedIn"));
  }
  return parts.join("  ·  ");
}
