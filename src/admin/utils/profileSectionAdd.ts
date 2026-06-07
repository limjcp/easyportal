import {
  aggregateOccupancyProfiles,
  applyProfileDetailsToDisplayFields,
  emptyOccupancyProfileDetails,
} from "../../data/supabase/occupancyProfileDetails";
import { RESIDENT_DETAIL_SECTIONS } from "../../resident/data/residentDetailConfig";
import type {
  ResidentDetailSection,
  ResidentProfileDetails,
  UnitsUsersUnitDetail,
  UnitsUsersUserDetail,
} from "../../resident/data/types";

export function cloneProfileDetails(details?: ResidentProfileDetails): ResidentProfileDetails | undefined {
  return details ? structuredClone(details) : undefined;
}

export function cloneUnitDetail(unit: UnitsUsersUnitDetail): UnitsUsersUnitDetail {
  return {
    ...unit,
    occupants: unit.occupants.map((occupant) => ({
      ...occupant,
      statusTags: [...occupant.statusTags],
    })),
    parkingSpots: [...(unit.parkingSpots ?? [])],
    lockers: [...(unit.lockers ?? [])],
    bikeSpaces: [...(unit.bikeSpaces ?? [])],
    keyFobs: [...(unit.keyFobs ?? [])],
    vehicles: [...(unit.vehicles ?? [])],
    guestList: [...(unit.guestList ?? [])],
    pets: [...(unit.pets ?? [])],
    documents: [...(unit.documents ?? [])],
    notes: [...(unit.notes ?? [])],
    profileDetails: cloneProfileDetails(unit.profileDetails),
    occupancyProfiles: unit.occupancyProfiles?.map((profile) => structuredClone(profile)),
    occupancyProfileOccupancyIds: unit.occupancyProfileOccupancyIds
      ? [...unit.occupancyProfileOccupancyIds]
      : undefined,
  };
}

export function cloneUserDetail(user: UnitsUsersUserDetail): UnitsUsersUserDetail {
  return {
    ...user,
    statusTags: [...user.statusTags],
    parkingSpots: [...(user.parkingSpots ?? [])],
    lockers: [...(user.lockers ?? [])],
    bikeSpaces: [...(user.bikeSpaces ?? [])],
    keyFobs: [...(user.keyFobs ?? [])],
    vehicles: [...(user.vehicles ?? [])],
    guestList: [...(user.guestList ?? [])],
    pets: [...(user.pets ?? [])],
    notes: [...(user.notes ?? [])],
    portalModules: user.portalModules?.map((module) => ({ ...module })),
    buildingAdminModules: user.buildingAdminModules?.map((module) => ({ ...module })),
    profileDetails: cloneProfileDetails(user.profileDetails),
  };
}

export function ensureProfileDetails(details?: ResidentProfileDetails): ResidentProfileDetails {
  return details ? structuredClone(details) : emptyOccupancyProfileDetails();
}

export function syncUserDetailProfileDisplay(detail: UnitsUsersUserDetail): void {
  if (!detail.profileDetails) return;
  const display = applyProfileDetailsToDisplayFields(detail.profileDetails);
  detail.parkingSpots = display.parkingSpots;
  detail.lockers = display.lockers;
  detail.bikeSpaces = display.bikeSpaces;
  detail.keyFobs = display.keyFobs;
  detail.vehicles = display.vehicles;
  detail.guestList = display.guestList;
  detail.pets = display.pets;
  detail.purchaseDateMaintFees = display.purchaseDateMaintFeesDisplay || undefined;
}

export function syncUnitDetailProfileDisplay(detail: UnitsUsersUnitDetail): void {
  detail.parkingSpots = [...(detail.parkingSpots ?? [])];
  detail.lockers = [...(detail.lockers ?? [])];
  detail.bikeSpaces = [...(detail.bikeSpaces ?? [])];

  const profiles = detail.occupancyProfiles ?? (detail.profileDetails ? [detail.profileDetails] : []);
  const aggregated = aggregateOccupancyProfiles(profiles);
  detail.keyFobs = aggregated.keyFobs;
  detail.vehicles = aggregated.vehicles;
  detail.guestList = aggregated.guestList;
  detail.pets = aggregated.pets;
  detail.purchaseDateMaintFees = aggregated.purchaseDateMaintFees || undefined;
}

export function promptStringListItem(label: string, placeholder?: string): string | null {
  const value = window.prompt(`Add ${label}:`, placeholder ?? "");
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function newId(): string {
  return crypto.randomUUID();
}

export function promptAddProfileSectionItem(
  section: ResidentDetailSection,
  profileDetails: ResidentProfileDetails
): boolean {
  const config = RESIDENT_DETAIL_SECTIONS.find((entry) => entry.section === section);
  if (!config) return false;

  if (config.formType === "stringList") {
    const value = promptStringListItem(config.itemLabel, config.placeholder);
    if (!value) return false;
    const list = profileDetails[section] as string[];
    profileDetails[section] = [...list, value] as never;
    return true;
  }

  if (config.formType === "objectList") {
    const maxItems = config.maxItems;
    const list = profileDetails[section] as Array<{ id: string }>;
    if (maxItems && list.length >= maxItems) {
      window.alert(`You may register up to ${maxItems} item(s).`);
      return false;
    }
    const values: Record<string, string> = {};
    for (const field of config.fields) {
      const value = window.prompt(`${field.label}:`, field.placeholder ?? "");
      if (!value?.trim()) return false;
      values[field.key] = value.trim();
    }
    if (section === "keyFobs") {
      profileDetails.keyFobs = [
        ...profileDetails.keyFobs,
        { id: newId(), fobNumber: values.fobNumber ?? "", description: values.description },
      ];
    } else if (section === "vehicles") {
      profileDetails.vehicles = [
        ...profileDetails.vehicles,
        {
          id: newId(),
          make: values.make ?? "",
          model: values.model ?? "",
          year: values.year ?? "",
          plate: values.plate ?? "",
          color: values.color ?? "",
        },
      ];
    } else if (section === "guestList") {
      profileDetails.guestList = [
        ...profileDetails.guestList,
        {
          id: newId(),
          name: values.name ?? "",
          phone: values.phone ?? "",
          email: values.email,
          notes: values.notes,
        },
      ];
    } else if (section === "pets") {
      profileDetails.pets = [
        ...profileDetails.pets,
        {
          id: newId(),
          name: values.name ?? "",
          type: values.type ?? "",
          breed: values.breed,
          weight: values.weight,
        },
      ];
    }
    return true;
  }

  if (config.formType === "single" && section === "purchaseDateMaintFees") {
    const purchaseDate = window.prompt("Purchase date:", profileDetails.purchaseDateMaintFees.purchaseDate);
    if (purchaseDate === null) return false;
    const monthlyFee = window.prompt(
      "Monthly fee:",
      profileDetails.purchaseDateMaintFees.monthlyFee ?? ""
    );
    if (monthlyFee === null) return false;
    profileDetails.purchaseDateMaintFees = {
      ...profileDetails.purchaseDateMaintFees,
      purchaseDate: purchaseDate.trim(),
      monthlyFee: monthlyFee.trim() || undefined,
    };
    return true;
  }

  return false;
}

function primaryProfileIndex(detail: UnitsUsersUnitDetail): number {
  const ids = detail.occupancyProfileOccupancyIds ?? [];
  if (detail.primaryOccupancyId) {
    const idx = ids.indexOf(detail.primaryOccupancyId);
    if (idx >= 0) return idx;
  }
  return ids.length > 0 ? 0 : -1;
}

export function updatePrimaryUnitProfileSection(
  detail: UnitsUsersUnitDetail,
  section: ResidentDetailSection
): UnitsUsersUnitDetail | null {
  if (section === "parkingSpots" || section === "lockers" || section === "bikeSpaces") {
    const label =
      section === "parkingSpots" ? "parking spot" : section === "lockers" ? "locker" : "bike space";
    const value = promptStringListItem(label);
    if (!value) return null;
    const list = [...(detail[section] ?? []), value];
    const profileDetails = detail.profileDetails
      ? { ...detail.profileDetails, [section]: [...detail.profileDetails[section], value] }
      : undefined;
    const next: UnitsUsersUnitDetail = {
      ...detail,
      [section]: list,
      profileDetails,
    };
    syncUnitDetailProfileDisplay(next);
    return next;
  }

  if (!detail.primaryOccupancyId) {
    window.alert("No resident occupancy is linked to this unit yet.");
    return null;
  }

  const profileDetails = structuredClone(detail.profileDetails ?? emptyOccupancyProfileDetails());
  if (!promptAddProfileSectionItem(section, profileDetails)) return null;

  const profiles = [...(detail.occupancyProfiles ?? [])];
  const idx = primaryProfileIndex(detail);
  if (idx >= 0) {
    profiles[idx] = profileDetails;
  } else {
    profiles.push(profileDetails);
  }

  const next: UnitsUsersUnitDetail = {
    ...detail,
    profileDetails,
    occupancyProfiles: profiles,
  };
  syncUnitDetailProfileDisplay(next);
  return next;
}

export function updateUserProfileSection(
  detail: UnitsUsersUserDetail,
  section: ResidentDetailSection
): UnitsUsersUserDetail | null {
  const profileDetails = structuredClone(detail.profileDetails ?? emptyOccupancyProfileDetails());
  if (!promptAddProfileSectionItem(section, profileDetails)) return null;
  const next: UnitsUsersUserDetail = { ...detail, profileDetails };
  syncUserDetailProfileDisplay(next);
  return next;
}

export type ProfileListSection = Extract<
  ResidentDetailSection,
  "parkingSpots" | "lockers" | "bikeSpaces" | "keyFobs" | "vehicles" | "guestList" | "pets" | "purchaseDateMaintFees"
>;
