export const PORTAL_SUBDOMAIN_DOMAIN = "easyportal.ca";

export function portalSubdomainHost(subdomain: string): string {
  const slug = subdomain.trim().toLowerCase();
  return slug ? `${slug}.${PORTAL_SUBDOMAIN_DOMAIN}` : PORTAL_SUBDOMAIN_DOMAIN;
}

export function buildLobbyDisplayUrl(subdomain: string): string {
  const slug = subdomain.trim().toLowerCase();
  if (!slug) return "";
  return `https://${slug}.${PORTAL_SUBDOMAIN_DOMAIN}/communities/login/tv/`;
}
