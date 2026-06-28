import type { ResidentDetailSection } from "../../resident/data/types";

export type ProfileFieldSource = "profile" | "occupancySection";

export type ProfileCompletionFieldDef = {
  fieldKey: string;
  source: ProfileFieldSource;
  occupancySection?: ResidentDetailSection;
  aliasOf?: string;
  completable: boolean;
};

export const PROFILE_COMPLETION_FIELDS: ProfileCompletionFieldDef[] = [
  { fieldKey: "firstName", source: "profile", completable: true },
  { fieldKey: "lastName", source: "profile", completable: true },
  { fieldKey: "email", source: "profile", completable: true },
  { fieldKey: "timezone", source: "profile", completable: true },
  { fieldKey: "homePhone", source: "profile", completable: true },
  { fieldKey: "cellPhone", source: "profile", completable: true },
  { fieldKey: "workPhone", source: "profile", completable: true },
  { fieldKey: "birthday", source: "profile", completable: true },
  { fieldKey: "vehicles", source: "occupancySection", occupancySection: "vehicles", completable: true },
  { fieldKey: "pets", source: "occupancySection", occupancySection: "pets", completable: true },
  { fieldKey: "guestList", source: "occupancySection", occupancySection: "guestList", completable: true },
  { fieldKey: "emergency", source: "occupancySection", occupancySection: "guestList", aliasOf: "guestList", completable: true },
  { fieldKey: "parkingSpots", source: "occupancySection", occupancySection: "parkingSpots", completable: true },
  { fieldKey: "lockers", source: "occupancySection", occupancySection: "lockers", completable: true },
  { fieldKey: "keyFobs", source: "occupancySection", occupancySection: "keyFobs", completable: true },
  { fieldKey: "bikeSpaces", source: "occupancySection", occupancySection: "bikeSpaces", completable: true },
  { fieldKey: "purchaseDateMaintFees", source: "occupancySection", occupancySection: "purchaseDateMaintFees", completable: true },
  { fieldKey: "homeAddress", source: "profile", completable: false },
  { fieldKey: "buzzerCode", source: "profile", completable: false },
];

export function getFieldDef(fieldKey: string): ProfileCompletionFieldDef | undefined {
  return PROFILE_COMPLETION_FIELDS.find((f) => f.fieldKey === fieldKey);
}
