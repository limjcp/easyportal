export type IntuitEnv = "production" | "sandbox";

/** Defaults to production — required for real client QuickBooks companies. */
export function getIntuitEnv(): IntuitEnv {
  const raw = (Deno.env.get("INTUIT_ENV") ?? "production").trim().toLowerCase();
  return raw === "sandbox" ? "sandbox" : "production";
}

export function getQuickBooksApiBase(): string {
  return getIntuitEnv() === "sandbox"
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";
}

export function buildQuickBooksQueryUrl(realmId: string, query: string, minorVersion = 75): string {
  const base = getQuickBooksApiBase();
  return (
    `${base}/v3/company/${encodeURIComponent(realmId)}/query` +
    `?query=${encodeURIComponent(query)}` +
    `&minorversion=${minorVersion}`
  );
}
