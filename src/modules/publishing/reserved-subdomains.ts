/** System subdomains that cannot be assigned to customer websites. */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "dashboard",
  "login",
  "signup",
  "auth",
  "support",
  "help",
  "mail",
  "status",
  "static",
  "assets",
  "cdn",
]);

export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.has(subdomain.trim().toLowerCase());
}
