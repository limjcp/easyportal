import type {
  ResidentDetailSection,
  ResidentDetailSectionData,
  ResidentGuest,
  ResidentKeyFob,
  ResidentPet,
  ResidentProfileDetails,
  ResidentPurchaseMaintFees,
  ResidentVehicle,
} from "../../resident/data/types";
import { mapDbError, sb } from "./base";

const EMPTY_PROFILE: ResidentProfileDetails = {
  parkingSpots: [],
  lockers: [],
  keyFobs: [],
  vehicles: [],
  guestList: [],
  bikeSpaces: [],
  pets: [],
  purchaseDateMaintFees: { purchaseDate: "" },
};

export function emptyOccupancyProfileDetails(): ResidentProfileDetails {
  return structuredClone(EMPTY_PROFILE);
}

export function formatVehicle(v: ResidentVehicle): string {
  const base = [v.year, v.make, v.model].filter(Boolean).join(" ").trim();
  const plate = v.plate?.trim();
  const color = v.color?.trim();
  if (base && plate) {
    return color ? `${base} · ${plate} (${color})` : `${base} · ${plate}`;
  }
  return base || plate || color || "Vehicle";
}

export function formatKeyFob(f: ResidentKeyFob): string {
  return f.description?.trim() ? `${f.fobNumber} — ${f.description}` : f.fobNumber;
}

export function formatGuest(g: ResidentGuest): string {
  return g.phone?.trim() ? `${g.name} · ${g.phone}` : g.name;
}

export function formatPet(p: ResidentPet): string {
  return p.type?.trim() ? `${p.name} (${p.type})` : p.name;
}

export function formatMaintFees(fees: ResidentPurchaseMaintFees): string {
  const parts = [fees.purchaseDate?.trim(), fees.monthlyFee?.trim()].filter(Boolean);
  return parts.join(" · ");
}

export function formatProfileSectionItems(
  section: ResidentDetailSection,
  details: ResidentProfileDetails
): string[] {
  switch (section) {
    case "parkingSpots":
      return details.parkingSpots;
    case "lockers":
      return details.lockers;
    case "bikeSpaces":
      return details.bikeSpaces;
    case "keyFobs":
      return details.keyFobs.map(formatKeyFob);
    case "vehicles":
      return details.vehicles.map(formatVehicle);
    case "guestList":
      return details.guestList.map(formatGuest);
    case "pets":
      return details.pets.map(formatPet);
    case "purchaseDateMaintFees": {
      const line = formatMaintFees(details.purchaseDateMaintFees);
      return line ? [line] : [];
    }
    default:
      return [];
  }
}

export function applyProfileDetailsToDisplayFields(
  details: ResidentProfileDetails
): Pick<
  ResidentProfileDetails,
  "parkingSpots" | "lockers" | "bikeSpaces" | "keyFobs" | "vehicles" | "guestList" | "pets"
> & { purchaseDateMaintFeesDisplay: string } {
  return {
    parkingSpots: details.parkingSpots,
    lockers: details.lockers,
    bikeSpaces: details.bikeSpaces,
    keyFobs: formatProfileSectionItems("keyFobs", details),
    vehicles: formatProfileSectionItems("vehicles", details),
    guestList: formatProfileSectionItems("guestList", details),
    pets: formatProfileSectionItems("pets", details),
    purchaseDateMaintFeesDisplay: formatMaintFees(details.purchaseDateMaintFees),
  };
}

export function aggregateOccupancyProfiles(profiles: ResidentProfileDetails[]): {
  keyFobs: string[];
  vehicles: string[];
  guestList: string[];
  pets: string[];
  purchaseDateMaintFees: string;
} {
  const keyFobs = profiles.flatMap((p) => p.keyFobs.map(formatKeyFob));
  const vehicles = profiles.flatMap((p) => p.vehicles.map(formatVehicle));
  const guestList = profiles.flatMap((p) => p.guestList.map(formatGuest));
  const pets = profiles.flatMap((p) => p.pets.map(formatPet));
  const purchaseDateMaintFees =
    profiles.map((p) => formatMaintFees(p.purchaseDateMaintFees)).find(Boolean) ?? "";
  return { keyFobs, vehicles, guestList, pets, purchaseDateMaintFees };
}

export async function loadOccupancyProfileDetails(
  occupancyId: string,
  buildingId: string
): Promise<ResidentProfileDetails> {
  const { data: occupancy, error: occError } = await sb()
    .from("unit_occupancies")
    .select("id, unit_id, units(parking_spots, lockers, bike_spaces)")
    .eq("id", occupancyId)
    .eq("building_id", buildingId)
    .maybeSingle();
  mapDbError(occError);
  if (!occupancy) return emptyOccupancyProfileDetails();

  const unit = occupancy.units as {
    parking_spots?: string[];
    lockers?: string[];
    bike_spaces?: string[];
  } | null;

  const [{ data: fobs }, { data: vehicles }, { data: guests }, { data: pets }, { data: fees }] =
    await Promise.all([
      sb().from("resident_key_fobs").select("*").eq("occupancy_id", occupancyId),
      sb().from("resident_vehicles").select("*").eq("occupancy_id", occupancyId),
      sb().from("resident_guests").select("*").eq("occupancy_id", occupancyId),
      sb().from("resident_pets").select("*").eq("occupancy_id", occupancyId),
      sb().from("resident_maint_fees").select("*").eq("occupancy_id", occupancyId).maybeSingle(),
    ]);

  return {
    parkingSpots: unit?.parking_spots ?? [],
    lockers: unit?.lockers ?? [],
    bikeSpaces: unit?.bike_spaces ?? [],
    keyFobs: (fobs ?? []).map(
      (f): ResidentKeyFob => ({
        id: f.id as string,
        fobNumber: f.fob_number as string,
        description: (f.description as string | undefined) ?? undefined,
      })
    ),
    vehicles: (vehicles ?? []).map(
      (v): ResidentVehicle => ({
        id: v.id as string,
        make: v.make as string,
        model: v.model as string,
        year: v.year as string,
        plate: v.plate as string,
        color: v.color as string,
      })
    ),
    guestList: (guests ?? []).map(
      (g): ResidentGuest => ({
        id: g.id as string,
        name: g.name as string,
        phone: g.phone as string,
        email: (g.email as string | undefined) ?? undefined,
        notes: (g.notes as string | undefined) ?? undefined,
      })
    ),
    pets: (pets ?? []).map(
      (p): ResidentPet => ({
        id: p.id as string,
        name: p.name as string,
        type: p.pet_type as string,
        breed: (p.breed as string | undefined) ?? undefined,
        weight: (p.weight as string | undefined) ?? undefined,
      })
    ),
    purchaseDateMaintFees: {
      purchaseDate: fees?.purchase_date ? String(fees.purchase_date) : "",
      monthlyFee: (fees?.monthly_fee as string | undefined) ?? undefined,
      notes: (fees?.notes as string | undefined) ?? undefined,
      quickBooksBalance: (fees?.quickbooks_balance as string | undefined) ?? undefined,
      nextPaymentAmount: (fees?.next_payment_amount as string | undefined) ?? undefined,
      nextPaymentDate: fees?.next_payment_date ? String(fees.next_payment_date) : undefined,
      minimumOneTimePayment: (fees?.minimum_one_time_payment as string | undefined) ?? undefined,
      lastPaymentAmount: (fees?.last_payment_amount as string | undefined) ?? undefined,
      lastPaymentDate: fees?.last_payment_date ? String(fees.last_payment_date) : undefined,
      paidMonths: (fees?.paid_months as string[] | undefined) ?? undefined,
    },
  };
}

export async function saveOccupancyProfileSection(
  occupancyId: string,
  buildingId: string,
  section: ResidentDetailSection,
  data: ResidentDetailSectionData
): Promise<void> {
  const { data: occupancy, error: occError } = await sb()
    .from("unit_occupancies")
    .select("id, unit_id")
    .eq("id", occupancyId)
    .eq("building_id", buildingId)
    .maybeSingle();
  mapDbError(occError);
  if (!occupancy) throw new Error("Occupancy not found.");

  const unitId = occupancy.unit_id as string | null;

  if (section === "parkingSpots" || section === "lockers" || section === "bikeSpaces") {
    if (!unitId) throw new Error("No unit assigned.");
    const column =
      section === "parkingSpots" ? "parking_spots" : section === "lockers" ? "lockers" : "bike_spaces";
    const { error } = await sb()
      .from("units")
      .update({ [column]: data as string[] })
      .eq("id", unitId)
      .eq("building_id", buildingId);
    mapDbError(error);
    return;
  }

  if (section === "keyFobs") {
    const { error: deleteError } = await sb().from("resident_key_fobs").delete().eq("occupancy_id", occupancyId);
    mapDbError(deleteError);
    const items = data as ResidentKeyFob[];
    if (items.length) {
      const { error } = await sb().from("resident_key_fobs").insert(
        items.map((item) => ({
          occupancy_id: occupancyId,
          building_id: buildingId,
          fob_number: item.fobNumber,
          description: item.description ?? null,
        }))
      );
      mapDbError(error);
    }
    return;
  }

  if (section === "vehicles") {
    const { error: deleteError } = await sb().from("resident_vehicles").delete().eq("occupancy_id", occupancyId);
    mapDbError(deleteError);
    const items = data as ResidentVehicle[];
    if (items.length) {
      const { error } = await sb().from("resident_vehicles").insert(
        items.map((item) => ({
          occupancy_id: occupancyId,
          building_id: buildingId,
          make: item.make,
          model: item.model,
          year: item.year,
          plate: item.plate,
          color: item.color,
        }))
      );
      mapDbError(error);
    }
    return;
  }

  if (section === "guestList") {
    const { error: deleteError } = await sb().from("resident_guests").delete().eq("occupancy_id", occupancyId);
    mapDbError(deleteError);
    const items = data as ResidentGuest[];
    if (items.length) {
      const { error } = await sb().from("resident_guests").insert(
        items.map((item) => ({
          occupancy_id: occupancyId,
          building_id: buildingId,
          name: item.name,
          phone: item.phone,
          email: item.email ?? null,
          notes: item.notes ?? null,
        }))
      );
      mapDbError(error);
    }
    return;
  }

  if (section === "pets") {
    const { error: deleteError } = await sb().from("resident_pets").delete().eq("occupancy_id", occupancyId);
    mapDbError(deleteError);
    const items = data as ResidentPet[];
    if (items.length) {
      const { error } = await sb().from("resident_pets").insert(
        items.map((item) => ({
          occupancy_id: occupancyId,
          building_id: buildingId,
          name: item.name,
          pet_type: item.type,
          breed: item.breed ?? null,
          weight: item.weight ?? null,
        }))
      );
      mapDbError(error);
    }
    return;
  }

  if (section === "purchaseDateMaintFees") {
    const fees = data as ResidentPurchaseMaintFees;
    const { error } = await sb()
      .from("resident_maint_fees")
      .upsert({
        occupancy_id: occupancyId,
        building_id: buildingId,
        purchase_date: fees.purchaseDate || null,
        monthly_fee: fees.monthlyFee ?? null,
        notes: fees.notes ?? null,
        quickbooks_balance: fees.quickBooksBalance ?? null,
        next_payment_amount: fees.nextPaymentAmount ?? null,
        next_payment_date: fees.nextPaymentDate ?? null,
        minimum_one_time_payment: fees.minimumOneTimePayment ?? null,
        last_payment_amount: fees.lastPaymentAmount ?? null,
        last_payment_date: fees.lastPaymentDate ?? null,
        paid_months: fees.paidMonths ?? [],
      });
    mapDbError(error);
  }
}

export async function saveChangedOccupancyProfileSections(
  occupancyId: string,
  buildingId: string,
  sections: ResidentDetailSection[],
  details: ResidentProfileDetails
): Promise<void> {
  for (const section of sections) {
    await saveOccupancyProfileSection(occupancyId, buildingId, section, details[section]);
  }
}

export async function saveOccupancyProfileDetails(
  occupancyId: string,
  buildingId: string,
  details: ResidentProfileDetails
): Promise<void> {
  const sections: ResidentDetailSection[] = [
    "parkingSpots",
    "lockers",
    "bikeSpaces",
    "keyFobs",
    "vehicles",
    "guestList",
    "pets",
    "purchaseDateMaintFees",
  ];
  for (const section of sections) {
    await saveOccupancyProfileSection(occupancyId, buildingId, section, details[section]);
  }
}
