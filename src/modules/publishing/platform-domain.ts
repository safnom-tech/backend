import { isReservedSubdomain } from "./reserved-subdomains.js";

export function parsePlatformDomainList(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return ["safnom.site"];
  }
  const domains = raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return domains.length > 0 ? domains : ["safnom.site"];
}

function sortDomainsLongestFirst(domains: string[]): string[] {
  return [...domains].sort((a, b) => b.length - a.length);
}

/** Apex platform domain for this host (e.g. app.safnom.in → safnom.in). */
export function resolvePlatformBaseDomain(
  host: string,
  platformDomains: string[]
): string | null {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  for (const platform of sortDomainsLongestFirst(platformDomains)) {
    if (hostname === platform || hostname === `www.${platform}`) {
      return platform;
    }
    const suffix = `.${platform}`;
    if (hostname.endsWith(suffix)) {
      return platform;
    }
  }
  return null;
}

/** Customer site slug from host (e.g. business.safnom.site → business). */
export function parseTenantSubdomainFromHost(
  host: string,
  platformDomains: string[]
): string | null {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const platform = resolvePlatformBaseDomain(host, platformDomains);
  if (!platform) return null;

  if (hostname === platform || hostname === `www.${platform}`) {
    return null;
  }

  const suffix = `.${platform}`;
  if (!hostname.endsWith(suffix)) return null;

  const sub = hostname.slice(0, -suffix.length);
  if (!sub || sub.includes(".")) return null;
  if (isReservedSubdomain(sub)) return null;
  return sub;
}

export function buildTenantSiteUrl(
  subdomain: string,
  platformDomain: string,
  options?: { protocol?: string; port?: string }
): string {
  const protocol = options?.protocol ?? "https";
  const port = options?.port?.trim();
  const portSuffix =
    port && port !== "80" && port !== "443" ? `:${port}` : "";
  return `${protocol}//${subdomain}.${platformDomain}${portSuffix}`;
}

export function hostFromRequestHeaders(headers: {
  origin?: string;
  referer?: string;
  "x-forwarded-host"?: string | string[];
  host?: string;
}): string | undefined {
  if (headers.origin) {
    try {
      return new URL(headers.origin).host;
    } catch {
      /* ignore */
    }
  }
  const forwarded = headers["x-forwarded-host"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(",")[0]?.trim();
  }
  if (headers.referer) {
    try {
      return new URL(headers.referer).host;
    } catch {
      /* ignore */
    }
  }
  if (headers.host?.trim()) {
    return headers.host.trim();
  }
  return undefined;
}
