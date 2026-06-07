import type { LoginPortalRole, Vendor } from "../resident/data/types";
import { companyStore } from "../legacy/company/companyStore";

const REMEMBER_KEY = "mvpcondos_remember_me";

export function validateMockLogin(username: string, password: string): boolean {
  return username.trim().length > 0 && password.trim().length > 0;
}

export function findVendorByUsername(username: string): Vendor | undefined {
  const u = username.trim().toLowerCase();
  if (!u) return undefined;

  const byEmail = companyStore.vendors.find((s) => s.email.toLowerCase() === u);
  if (byEmail) return byEmail;

  if (u.includes("vendor")) {
    return companyStore.vendors.find((s) => s.id === "sup-1") ?? companyStore.vendors[0];
  }

  return undefined;
}

export function resolveLoginPortal(username: string): LoginPortalRole {
  const u = username.trim().toLowerCase();
  if (u.includes("company") || u.includes("owner")) return "company";
  if (u.includes("admin")) return "building";
  if (u.includes("vendor") || findVendorByUsername(username)) return "vendor";
  return "resident";
}

export function validateVendorLogin(username: string): string | null {
  const vendor = findVendorByUsername(username);
  if (!vendor) {
    return "No vendor account found for this email. Try vendor@test.com or a vendor email from the registry.";
  }
  if (vendor.status === "inactive") {
    return "This vendor account is inactive. Contact your property management company.";
  }
  return null;
}

export function buildVendorSession(vendor: Vendor) {
  return {
    vendorId: vendor.id,
    displayName: vendor.contactName,
    companyName: vendor.companyName,
    email: vendor.email,
    tradeCategory: vendor.tradeCategory,
  };
}

export function setRememberMe(enabled: boolean): void {
  if (enabled) {
    sessionStorage.setItem(REMEMBER_KEY, "1");
  } else {
    sessionStorage.removeItem(REMEMBER_KEY);
  }
}

export function getRememberMe(): boolean {
  return sessionStorage.getItem(REMEMBER_KEY) === "1";
}
