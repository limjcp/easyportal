import { useEffect, useMemo, useState, type FormEvent } from "react";
import { TIMEZONE_OPTIONS } from "../company/data/mock/timezoneOptions";
import type { ProfileCompletionStatus } from "../data/supabase/profileCompletion";
import { residentRepo } from "../resident/data/mockRepository";
import type { ProfileCompletionSavePayload } from "../resident/data/repository";
import type {
  LoginPortalRole,
  ResidentGuest,
  ResidentKeyFob,
  ResidentPet,
  ResidentProfileDetails,
  ResidentPurchaseMaintFees,
  ResidentUser,
  ResidentVehicle,
} from "../resident/data/types";
import { useAuth } from "./AuthProvider";
import {
  AuthLayout,
  authInputClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
  authSecondaryButtonClassName,
} from "./AuthLayout";

type CompleteProfilePageProps = {
  pendingPortal: LoginPortalRole;
  onComplete: (portal: LoginPortalRole) => void;
  onSignOut: () => void;
};

type VehicleDraft = Omit<ResidentVehicle, "id">;
type GuestDraft = Pick<ResidentGuest, "name" | "phone">;
type PetDraft = Pick<ResidentPet, "name" | "type">;
type KeyFobDraft = Pick<ResidentKeyFob, "fobNumber" | "description">;

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  timezone: string;
  homePhone: string;
  cellPhone: string;
  workPhone: string;
  birthMonth: string;
  birthDay: string;
  vehicles: VehicleDraft[];
  pets: PetDraft[];
  guests: GuestDraft[];
  parkingSpots: string;
  lockers: string;
  bikeSpaces: string;
  keyFobs: KeyFobDraft[];
  purchaseDate: string;
};

function emptyVehicle(): VehicleDraft {
  return { make: "", model: "", year: "", plate: "", color: "" };
}

function emptyGuest(): GuestDraft {
  return { name: "", phone: "" };
}

function emptyPet(): PetDraft {
  return { name: "", type: "" };
}

function emptyKeyFob(): KeyFobDraft {
  return { fobNumber: "", description: "" };
}

function createInitialForm(
  missingFields: ProfileCompletionStatus["missingFields"],
  user: ResidentUser,
  details: ResidentProfileDetails
): FormValues {
  const keys = new Set(missingFields.map((f) => f.fieldKey));
  return {
    firstName: keys.has("firstName") ? (user.firstName ?? "") : "",
    lastName: keys.has("lastName") ? (user.lastName ?? "") : "",
    email: keys.has("email") ? user.email : "",
    timezone: keys.has("timezone") ? (user.timezone?.trim() || "America/Toronto") : "America/Toronto",
    homePhone: keys.has("homePhone") ? (user.homePhone ?? "") : "",
    cellPhone: keys.has("cellPhone") ? (user.cellPhone ?? user.phone ?? "") : "",
    workPhone: keys.has("workPhone") ? (user.workPhone ?? "") : "",
    birthMonth: keys.has("birthday") && user.birthMonth != null ? String(user.birthMonth) : "",
    birthDay: keys.has("birthday") && user.birthDay != null ? String(user.birthDay) : "",
    vehicles: keys.has("vehicles")
      ? details.vehicles.length > 0
        ? details.vehicles.map(({ make, model, year, plate, color }) => ({
            make,
            model,
            year,
            plate,
            color,
          }))
        : [emptyVehicle()]
      : [],
    pets: keys.has("pets")
      ? details.pets.length > 0
        ? details.pets.map(({ name, type }) => ({ name, type }))
        : [emptyPet()]
      : [],
    guests:
      keys.has("guestList") || keys.has("emergency")
        ? details.guestList.length > 0
          ? details.guestList.map(({ name, phone }) => ({ name, phone }))
          : [emptyGuest()]
        : [],
    parkingSpots: keys.has("parkingSpots") ? details.parkingSpots.join(", ") : "",
    lockers: keys.has("lockers") ? details.lockers.join(", ") : "",
    bikeSpaces: keys.has("bikeSpaces") ? details.bikeSpaces.join(", ") : "",
    keyFobs: keys.has("keyFobs")
      ? details.keyFobs.length > 0
        ? details.keyFobs.map(({ fobNumber, description }) => ({ fobNumber, description }))
        : [emptyKeyFob()]
      : [],
    purchaseDate: keys.has("purchaseDateMaintFees")
      ? (details.purchaseDateMaintFees.purchaseDate ?? "")
      : "",
  };
}

function dedupeMissingFields(
  missingFields: ProfileCompletionStatus["missingFields"]
): ProfileCompletionStatus["missingFields"] {
  const seen = new Set<string>();
  const result: ProfileCompletionStatus["missingFields"] = [];
  for (const field of missingFields) {
    const key = field.fieldKey === "emergency" ? "guestList" : field.fieldKey;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(field);
  }
  return result;
}

function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function validateForm(
  form: FormValues,
  missingFields: ProfileCompletionStatus["missingFields"]
): string | null {
  const keys = new Set(missingFields.map((f) => f.fieldKey));

  if (keys.has("firstName") && !form.firstName.trim()) return "First name is required.";
  if (keys.has("lastName") && !form.lastName.trim()) return "Last name is required.";
  if (keys.has("email") && !form.email.trim()) return "Email is required.";
  if (keys.has("timezone") && !form.timezone.trim()) return "Timezone is required.";
  if (keys.has("homePhone") && !form.homePhone.trim()) return "Home phone is required.";
  if (keys.has("cellPhone") && !form.cellPhone.trim()) return "Cell phone is required.";
  if (keys.has("workPhone") && !form.workPhone.trim()) return "Work phone is required.";
  if (keys.has("birthday")) {
    if (!form.birthMonth || !form.birthDay) return "Birthday month and day are required.";
  }
  if (keys.has("vehicles")) {
    const valid = form.vehicles.some((v) => v.make.trim() && v.plate.trim());
    if (!valid) return "At least one vehicle with make and plate is required.";
  }
  if (keys.has("pets")) {
    const valid = form.pets.some((p) => p.name.trim() && p.type.trim());
    if (!valid) return "At least one pet with name and type is required.";
  }
  if (keys.has("guestList") || keys.has("emergency")) {
    const valid = form.guests.some((g) => g.name.trim() && g.phone.trim());
    if (!valid) return "At least one contact with name and phone is required.";
  }
  if (keys.has("parkingSpots") && parseCommaList(form.parkingSpots).length === 0) {
    return "At least one parking spot is required.";
  }
  if (keys.has("lockers") && parseCommaList(form.lockers).length === 0) {
    return "At least one locker is required.";
  }
  if (keys.has("bikeSpaces") && parseCommaList(form.bikeSpaces).length === 0) {
    return "At least one bike space is required.";
  }
  if (keys.has("keyFobs")) {
    const valid = form.keyFobs.some((f) => f.fobNumber.trim());
    if (!valid) return "At least one key fob number is required.";
  }
  if (keys.has("purchaseDateMaintFees") && !form.purchaseDate.trim()) {
    return "Purchase date is required.";
  }

  return null;
}

function buildPayload(
  form: FormValues,
  missingFields: ProfileCompletionStatus["missingFields"]
): ProfileCompletionSavePayload {
  const keys = new Set(missingFields.map((f) => f.fieldKey));
  const payload: ProfileCompletionSavePayload = {};

  if (keys.has("firstName")) payload.firstName = form.firstName.trim();
  if (keys.has("lastName")) payload.lastName = form.lastName.trim();
  if (keys.has("email")) payload.email = form.email.trim();
  if (keys.has("timezone")) payload.timezone = form.timezone.trim();
  if (keys.has("homePhone")) payload.homePhone = form.homePhone.trim();
  if (keys.has("cellPhone")) payload.cellPhone = form.cellPhone.trim();
  if (keys.has("workPhone")) payload.workPhone = form.workPhone.trim();
  if (keys.has("birthday")) {
    payload.birthMonth = Number(form.birthMonth);
    payload.birthDay = Number(form.birthDay);
  }
  if (keys.has("vehicles")) {
    payload.vehicles = form.vehicles
      .filter((v) => v.make.trim() || v.plate.trim())
      .map((v, index) => ({
        id: String(Date.now() + index),
        make: v.make.trim(),
        model: v.model.trim(),
        year: v.year.trim(),
        plate: v.plate.trim(),
        color: v.color.trim(),
      }));
  }
  if (keys.has("pets")) {
    payload.pets = form.pets
      .filter((p) => p.name.trim() || p.type.trim())
      .map((p, index) => ({
        id: String(Date.now() + index),
        name: p.name.trim(),
        type: p.type.trim(),
      }));
  }
  if (keys.has("guestList") || keys.has("emergency")) {
    payload.guestList = form.guests
      .filter((g) => g.name.trim() || g.phone.trim())
      .map((g, index) => ({
        id: String(Date.now() + index),
        name: g.name.trim(),
        phone: g.phone.trim(),
      }));
  }
  if (keys.has("parkingSpots")) payload.parkingSpots = parseCommaList(form.parkingSpots);
  if (keys.has("lockers")) payload.lockers = parseCommaList(form.lockers);
  if (keys.has("bikeSpaces")) payload.bikeSpaces = parseCommaList(form.bikeSpaces);
  if (keys.has("keyFobs")) {
    payload.keyFobs = form.keyFobs
      .filter((f) => f.fobNumber.trim())
      .map((f, index) => ({
        id: String(Date.now() + index),
        fobNumber: f.fobNumber.trim(),
        description: f.description?.trim() || undefined,
      }));
  }
  if (keys.has("purchaseDateMaintFees")) {
    const fees: ResidentPurchaseMaintFees = {
      purchaseDate: form.purchaseDate.trim(),
    };
    payload.purchaseDateMaintFees = fees;
  }

  return payload;
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => index + 1);

export function CompleteProfilePage({ pendingPortal, onComplete, onSignOut }: CompleteProfilePageProps) {
  const auth = useAuth();
  const [status, setStatus] = useState<ProfileCompletionStatus | null>(null);
  const [form, setForm] = useState<FormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      residentRepo.getProfileCompletionStatus(),
      residentRepo.getUser(),
      residentRepo.getResidentDetails(),
    ])
      .then(([nextStatus, user, details]) => {
        if (cancelled) return;
        setStatus(nextStatus);
        if (nextStatus.phase === "none") {
          onComplete(pendingPortal);
          return;
        }
        setForm(createInitialForm(nextStatus.missingFields, user, details));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load profile requirements.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onComplete, pendingPortal]);

  const visibleFields = useMemo(
    () => (status ? dedupeMissingFields(status.missingFields) : []),
    [status]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || !status) return;

    setError("");
    const validationError = validateForm(form, status.missingFields);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const resultStatus = await residentRepo.saveProfileCompletion(
        buildPayload(form, status.missingFields)
      );
      await auth.refreshAuth({ force: true });
      if (resultStatus.phase === "none") {
        onComplete(pendingPortal);
      } else {
        setStatus(resultStatus);
        const labels = resultStatus.missingFields.map((f) => f.label).join(", ");
        setError(
          labels
            ? `Profile still incomplete. Missing: ${labels}`
            : "Profile could not be marked complete."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (patch: Partial<FormValues>) => {
    setForm((current) => (current ? { ...current, ...patch } : current));
  };

  if (loading || !form || !status || status.phase === "none") {
    return (
      <AuthLayout
        title="Complete your profile"
        subtitle="Your building requires additional information before you can access the portal."
      >
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : null}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Complete your profile"
      subtitle="Your building requires additional information before you can access the portal."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {visibleFields.map((field) => (
          <div key={field.fieldKey} className="space-y-3">
            <p className="text-sm font-medium text-slate-800">{field.label}</p>

            {field.fieldKey === "firstName" && (
              <div>
                <label htmlFor="profile-first-name" className={authLabelClassName}>
                  First name
                </label>
                <input
                  id="profile-first-name"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => updateForm({ firstName: e.target.value })}
                  className={`${authInputClassName} mt-1.5`}
                  autoComplete="given-name"
                />
              </div>
            )}

            {field.fieldKey === "lastName" && (
              <div>
                <label htmlFor="profile-last-name" className={authLabelClassName}>
                  Last name
                </label>
                <input
                  id="profile-last-name"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => updateForm({ lastName: e.target.value })}
                  className={`${authInputClassName} mt-1.5`}
                  autoComplete="family-name"
                />
              </div>
            )}

            {field.fieldKey === "email" && (
              <div>
                <label htmlFor="profile-email" className={authLabelClassName}>
                  Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm({ email: e.target.value })}
                  className={`${authInputClassName} mt-1.5`}
                  autoComplete="email"
                />
              </div>
            )}

            {field.fieldKey === "timezone" && (
              <div>
                <label htmlFor="profile-timezone" className={authLabelClassName}>
                  Timezone
                </label>
                <select
                  id="profile-timezone"
                  value={form.timezone}
                  onChange={(e) => updateForm({ timezone: e.target.value })}
                  className={`${authInputClassName} mt-1.5`}
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(field.fieldKey === "homePhone" ||
              field.fieldKey === "cellPhone" ||
              field.fieldKey === "workPhone") && (
              <div>
                <label htmlFor={`profile-${field.fieldKey}`} className={authLabelClassName}>
                  {field.label}
                </label>
                <input
                  id={`profile-${field.fieldKey}`}
                  type="tel"
                  value={
                    field.fieldKey === "homePhone"
                      ? form.homePhone
                      : field.fieldKey === "cellPhone"
                        ? form.cellPhone
                        : form.workPhone
                  }
                  onChange={(e) => {
                    if (field.fieldKey === "homePhone") updateForm({ homePhone: e.target.value });
                    else if (field.fieldKey === "cellPhone") updateForm({ cellPhone: e.target.value });
                    else updateForm({ workPhone: e.target.value });
                  }}
                  className={`${authInputClassName} mt-1.5`}
                  autoComplete="tel"
                />
              </div>
            )}

            {field.fieldKey === "birthday" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="profile-birth-month" className={authLabelClassName}>
                    Month
                  </label>
                  <select
                    id="profile-birth-month"
                    value={form.birthMonth}
                    onChange={(e) => updateForm({ birthMonth: e.target.value })}
                    className={`${authInputClassName} mt-1.5`}
                  >
                    <option value="">Select…</option>
                    {MONTH_OPTIONS.map((month) => (
                      <option key={month} value={String(month)}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="profile-birth-day" className={authLabelClassName}>
                    Day
                  </label>
                  <select
                    id="profile-birth-day"
                    value={form.birthDay}
                    onChange={(e) => updateForm({ birthDay: e.target.value })}
                    className={`${authInputClassName} mt-1.5`}
                  >
                    <option value="">Select…</option>
                    {DAY_OPTIONS.map((day) => (
                      <option key={day} value={String(day)}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {field.fieldKey === "vehicles" &&
              form.vehicles.map((vehicle, index) => (
                <div key={index} className="space-y-3 rounded border border-slate-200 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Vehicle {index + 1}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        ["make", "Make"],
                        ["model", "Model"],
                        ["year", "Year"],
                        ["plate", "Plate"],
                        ["color", "Color"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key}>
                        <label className={authLabelClassName}>{label}</label>
                        <input
                          type="text"
                          value={vehicle[key]}
                          onChange={(e) => {
                            const next = [...form.vehicles];
                            next[index] = { ...next[index], [key]: e.target.value };
                            updateForm({ vehicles: next });
                          }}
                          className={`${authInputClassName} mt-1.5`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {field.fieldKey === "pets" &&
              form.pets.map((pet, index) => (
                <div key={index} className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={authLabelClassName}>Name</label>
                    <input
                      type="text"
                      value={pet.name}
                      onChange={(e) => {
                        const next = [...form.pets];
                        next[index] = { ...next[index], name: e.target.value };
                        updateForm({ pets: next });
                      }}
                      className={`${authInputClassName} mt-1.5`}
                    />
                  </div>
                  <div>
                    <label className={authLabelClassName}>Type</label>
                    <input
                      type="text"
                      value={pet.type}
                      onChange={(e) => {
                        const next = [...form.pets];
                        next[index] = { ...next[index], type: e.target.value };
                        updateForm({ pets: next });
                      }}
                      className={`${authInputClassName} mt-1.5`}
                    />
                  </div>
                </div>
              ))}

            {(field.fieldKey === "guestList" || field.fieldKey === "emergency") &&
              form.guests.map((guest, index) => (
                <div key={index} className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={authLabelClassName}>Name</label>
                    <input
                      type="text"
                      value={guest.name}
                      onChange={(e) => {
                        const next = [...form.guests];
                        next[index] = { ...next[index], name: e.target.value };
                        updateForm({ guests: next });
                      }}
                      className={`${authInputClassName} mt-1.5`}
                    />
                  </div>
                  <div>
                    <label className={authLabelClassName}>Phone</label>
                    <input
                      type="tel"
                      value={guest.phone}
                      onChange={(e) => {
                        const next = [...form.guests];
                        next[index] = { ...next[index], phone: e.target.value };
                        updateForm({ guests: next });
                      }}
                      className={`${authInputClassName} mt-1.5`}
                    />
                  </div>
                </div>
              ))}

            {(field.fieldKey === "parkingSpots" ||
              field.fieldKey === "lockers" ||
              field.fieldKey === "bikeSpaces") && (
              <div>
                <label htmlFor={`profile-${field.fieldKey}`} className={authLabelClassName}>
                  {field.fieldKey === "parkingSpots"
                    ? "Parking spots"
                    : field.fieldKey === "lockers"
                      ? "Lockers"
                      : "Bike spaces"}
                </label>
                <input
                  id={`profile-${field.fieldKey}`}
                  type="text"
                  value={
                    field.fieldKey === "parkingSpots"
                      ? form.parkingSpots
                      : field.fieldKey === "lockers"
                        ? form.lockers
                        : form.bikeSpaces
                  }
                  onChange={(e) => {
                    if (field.fieldKey === "parkingSpots") updateForm({ parkingSpots: e.target.value });
                    else if (field.fieldKey === "lockers") updateForm({ lockers: e.target.value });
                    else updateForm({ bikeSpaces: e.target.value });
                  }}
                  placeholder="Separate multiple values with commas"
                  className={`${authInputClassName} mt-1.5`}
                />
              </div>
            )}

            {field.fieldKey === "keyFobs" &&
              form.keyFobs.map((fob, index) => (
                <div key={index} className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={authLabelClassName}>Fob number</label>
                    <input
                      type="text"
                      value={fob.fobNumber}
                      onChange={(e) => {
                        const next = [...form.keyFobs];
                        next[index] = { ...next[index], fobNumber: e.target.value };
                        updateForm({ keyFobs: next });
                      }}
                      className={`${authInputClassName} mt-1.5`}
                    />
                  </div>
                  <div>
                    <label className={authLabelClassName}>Description (optional)</label>
                    <input
                      type="text"
                      value={fob.description ?? ""}
                      onChange={(e) => {
                        const next = [...form.keyFobs];
                        next[index] = { ...next[index], description: e.target.value };
                        updateForm({ keyFobs: next });
                      }}
                      className={`${authInputClassName} mt-1.5`}
                    />
                  </div>
                </div>
              ))}

            {field.fieldKey === "purchaseDateMaintFees" && (
              <div>
                <label htmlFor="profile-purchase-date" className={authLabelClassName}>
                  Purchase date
                </label>
                <input
                  id="profile-purchase-date"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => updateForm({ purchaseDate: e.target.value })}
                  className={`${authInputClassName} mt-1.5`}
                />
              </div>
            )}
          </div>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting} className={authPrimaryButtonClassName}>
          {submitting ? "Saving…" : "Save and continue"}
        </button>

        <p className="text-center text-sm text-slate-500">
          <button type="button" className={authSecondaryButtonClassName} onClick={() => void onSignOut()}>
            Sign out
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
