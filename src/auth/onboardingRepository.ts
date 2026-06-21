import { requireSupabase } from "../lib/supabaseClient";
import type { UnitsUsersResidentType } from "../resident/data/types";

export type OnboardingLookupResult = {
  buildingId: string;
  buildingName: string;
  corporation: string;
  address: string;
  city: string;
  unitNumber: string;
  firstName: string;
  quickbooksMatched: boolean;
  quickbooksBalance: string | null;
};

export type OnboardingRegisterPayload = {
  email: string;
  firstName: string;
  corpNumber: string;
  city: string;
  unitNumber: string;
  residentType: UnitsUsersResidentType;
  buildingId: string;
  quickbooksMatched: boolean;
  quickbooksBalance: string | null;
  recaptchaToken?: string | null;
};

export type OnboardingRegisterResult = {
  requestId: string;
  status: "pending";
};

export async function lookupOnboardingBuilding(input: {
  corpNumber: string;
  city: string;
  unitNumber: string;
  firstName: string;
  recaptchaToken?: string | null;
}): Promise<OnboardingLookupResult> {
  const { data, error } = await requireSupabase().functions.invoke("onboarding-lookup", {
    body: input,
  });

  if (error) {
    throw new Error(error.message || "Building lookup failed.");
  }

  const body = data as { error?: string } & Partial<OnboardingLookupResult>;
  if (body?.error) {
    throw new Error(body.error);
  }
  if (!body?.buildingId) {
    throw new Error("Invalid response from building lookup.");
  }

  return body as OnboardingLookupResult;
}

export async function registerOnboardingRequest(
  payload: OnboardingRegisterPayload
): Promise<OnboardingRegisterResult> {
  const { data, error } = await requireSupabase().functions.invoke("onboarding-register", {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || "Registration failed.");
  }

  const body = data as { error?: string } & Partial<OnboardingRegisterResult>;
  if (body?.error) {
    throw new Error(body.error);
  }
  if (!body?.requestId) {
    throw new Error("Invalid response from registration.");
  }

  return {
    requestId: body.requestId,
    status: "pending",
  };
}
