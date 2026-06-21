import { useState, type FormEvent } from "react";
import { executeRecaptcha } from "../shared/recaptcha";
import type { UnitsUsersResidentType } from "../resident/data/types";
import {
  lookupOnboardingBuilding,
  registerOnboardingRequest,
  type OnboardingLookupResult,
} from "./onboardingRepository";
import {
  authInputClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
  authSecondaryButtonClassName,
} from "./AuthLayout";

const RESIDENT_TYPES: UnitsUsersResidentType[] = [
  "Owner",
  "Tenant",
  "Absentee Owner",
  "Occupant",
  "Unit Manager",
];

type SignupWizardProps = {
  onComplete: () => void;
  onSwitchToSignIn: () => void;
};

type Step = "identity" | "preview" | "role" | "done";

type IdentityForm = {
  unitNumber: string;
  firstName: string;
  corpNumber: string;
  city: string;
  email: string;
};

export function SignupWizard({ onComplete, onSwitchToSignIn }: SignupWizardProps) {
  const [step, setStep] = useState<Step>("identity");
  const [identity, setIdentity] = useState<IdentityForm>({
    unitNumber: "",
    firstName: "",
    corpNumber: "",
    city: "",
    email: "",
  });
  const [lookup, setLookup] = useState<OnboardingLookupResult | null>(null);
  const [residentType, setResidentType] = useState<UnitsUsersResidentType>("Owner");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleIdentitySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const recaptchaToken = await executeRecaptcha("onboarding_lookup");
      const result = await lookupOnboardingBuilding({
        corpNumber: identity.corpNumber,
        city: identity.city,
        unitNumber: identity.unitNumber,
        firstName: identity.firstName,
        recaptchaToken,
      });
      setLookup(result);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!lookup) return;
    setError("");
    setLoading(true);
    try {
      const recaptchaToken = await executeRecaptcha("onboarding_register");
      await registerOnboardingRequest({
        email: identity.email.trim(),
        firstName: identity.firstName.trim(),
        corpNumber: identity.corpNumber.trim(),
        city: identity.city.trim(),
        unitNumber: identity.unitNumber.trim(),
        residentType,
        buildingId: lookup.buildingId,
        quickbooksMatched: lookup.quickbooksMatched,
        quickbooksBalance: lookup.quickbooksBalance,
        recaptchaToken,
      });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-slate-600">
          Your registration request has been submitted. Your property manager will review your details and contact
          you when resident portal access is ready. You will not be able to sign in until access is approved.
        </p>
        <button type="button" className={authPrimaryButtonClassName} onClick={onComplete}>
          Back to sign in
        </button>
      </div>
    );
  }

  if (step === "preview" && lookup) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-900">Confirm your building</p>
          <p className="mt-1 text-sm text-slate-500">Review the details we found for your corporation.</p>
        </div>

        <dl className="space-y-3 rounded border border-slate-200 bg-slate-50 p-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Building</dt>
            <dd className="mt-1 font-medium text-slate-900">{lookup.buildingName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Corporation</dt>
            <dd className="mt-1 text-slate-900">{lookup.corporation || lookup.buildingName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Address</dt>
            <dd className="mt-1 text-slate-900">{lookup.address || lookup.city}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Unit</dt>
            <dd className="mt-1 text-slate-900">{lookup.unitNumber}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">First name</dt>
            <dd className="mt-1 text-slate-900">{lookup.firstName}</dd>
          </div>
          {lookup.quickbooksMatched && (
            <div className="border-t border-slate-200 pt-3">
              <span className="inline-flex rounded bg-[#2ca01c]/10 px-2 py-1 text-xs font-medium text-[#2ca01c]">
                Matched via QuickBooks
              </span>
              {lookup.quickbooksBalance && (
                <p className="mt-2 text-slate-700">
                  Account balance: <span className="font-medium">{lookup.quickbooksBalance}</span>
                </p>
              )}
            </div>
          )}
        </dl>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button type="button" className={authSecondaryButtonClassName} onClick={() => setStep("identity")}>
            Back
          </button>
          <button type="button" className={`${authPrimaryButtonClassName} flex-1`} onClick={() => setStep("role")}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (step === "role" && lookup) {
    return (
      <form onSubmit={handleRegister} className="space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-900">Resident type</p>
          <p className="mt-1 text-sm text-slate-500">
            Choose how you are associated with this unit. Your property manager must approve access before you can
            sign in.
          </p>
        </div>

        <fieldset className="space-y-2">
          {RESIDENT_TYPES.map((type) => (
            <label
              key={type}
              className="flex cursor-pointer items-center gap-3 rounded border border-slate-200 px-3 py-2.5 text-sm hover:border-[#0078c8]"
            >
              <input
                type="radio"
                name="residentType"
                value={type}
                checked={residentType === type}
                onChange={() => setResidentType(type)}
                className="accent-[#0078c8]"
              />
              <span>{type}</span>
            </label>
          ))}
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button type="button" className={authSecondaryButtonClassName} onClick={() => setStep("preview")}>
            Back
          </button>
          <button type="submit" disabled={loading} className={`${authPrimaryButtonClassName} flex-1`}>
            {loading ? "Submitting…" : "Submit registration request"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleIdentitySubmit} className="space-y-4">
      <div>
        <label htmlFor="signup-unit" className={authLabelClassName}>
          Condo / unit #
        </label>
        <input
          id="signup-unit"
          type="text"
          required
          value={identity.unitNumber}
          onChange={(e) => setIdentity((prev) => ({ ...prev, unitNumber: e.target.value }))}
          className={`${authInputClassName} mt-1.5`}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="signup-first-name" className={authLabelClassName}>
          First name
        </label>
        <input
          id="signup-first-name"
          type="text"
          required
          value={identity.firstName}
          onChange={(e) => setIdentity((prev) => ({ ...prev, firstName: e.target.value }))}
          className={`${authInputClassName} mt-1.5`}
          autoComplete="given-name"
        />
      </div>

      <div>
        <label htmlFor="signup-corp" className={authLabelClassName}>
          Corporation #
        </label>
        <input
          id="signup-corp"
          type="text"
          required
          value={identity.corpNumber}
          onChange={(e) => setIdentity((prev) => ({ ...prev, corpNumber: e.target.value }))}
          className={`${authInputClassName} mt-1.5`}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="signup-city" className={authLabelClassName}>
          City
        </label>
        <input
          id="signup-city"
          type="text"
          required
          value={identity.city}
          onChange={(e) => setIdentity((prev) => ({ ...prev, city: e.target.value }))}
          className={`${authInputClassName} mt-1.5`}
          autoComplete="address-level2"
        />
      </div>

      <div className="border-t border-slate-200 pt-4">
        <label htmlFor="signup-email" className={authLabelClassName}>
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          required
          value={identity.email}
          onChange={(e) => setIdentity((prev) => ({ ...prev, email: e.target.value }))}
          className={`${authInputClassName} mt-1.5`}
          autoComplete="email"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className={authPrimaryButtonClassName}>
        {loading ? "Looking up building…" : "Continue"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <button type="button" className={authSecondaryButtonClassName} onClick={onSwitchToSignIn}>
          Sign in
        </button>
      </p>
    </form>
  );
}
