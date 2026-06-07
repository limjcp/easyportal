import type { IconType } from "react-icons";
import {
  FaBicycle,
  FaCalendarAlt,
  FaCar,
  FaKey,
  FaLock,
  FaParking,
  FaPaw,
  FaUserFriends,
} from "react-icons/fa";
import type {
  PortalModuleConfig,
  ResidentDetailSection,
} from "./types";

export const DETAIL_TILE_LABEL_TO_FIELD: Record<string, ResidentDetailSection> = {
  Parking: "parkingSpots",
  "Parking Spots": "parkingSpots",
  Lockers: "lockers",
  "Key Fobs": "keyFobs",
  Vehicles: "vehicles",
  "Guest List": "guestList",
  "Bike Spaces": "bikeSpaces",
  Pets: "pets",
  "Condo Fees": "purchaseDateMaintFees",
};

export const DETAIL_TILE_ICONS: Record<string, IconType> = {
  Parking: FaParking,
  "Parking Spots": FaParking,
  Lockers: FaLock,
  "Key Fobs": FaKey,
  Vehicles: FaCar,
  "Guest List": FaUserFriends,
  "Bike Spaces": FaBicycle,
  Pets: FaPaw,
  "Condo Fees": FaCalendarAlt,
};

export type ListFieldDef = {
  key: string;
  label: string;
  type?: "text" | "email" | "tel";
  placeholder?: string;
};

export type DetailSectionConfig =
  | {
      section: ResidentDetailSection;
      moduleId: string;
      title: string;
      formType: "stringList";
      itemLabel: string;
      placeholder?: string;
    }
  | {
      section: ResidentDetailSection;
      moduleId: string;
      title: string;
      formType: "objectList";
      fields: ListFieldDef[];
      maxItems?: number;
      emptyTitle: string;
      emptySubtitle: string;
    }
  | {
      section: ResidentDetailSection;
      moduleId: string;
      title: string;
      formType: "single";
      fields: ListFieldDef[];
    };

export const RESIDENT_DETAIL_SECTIONS: DetailSectionConfig[] = [
  {
    section: "parkingSpots",
    moduleId: "parkingSpots",
    title: "Parking",
    formType: "stringList",
    itemLabel: "Assigned spot",
    placeholder: "e.g. P-102A",
  },
  {
    section: "lockers",
    moduleId: "lockers",
    title: "Lockers",
    formType: "stringList",
    itemLabel: "Locker number",
    placeholder: "e.g. L-14",
  },
  {
    section: "keyFobs",
    moduleId: "keyFobs",
    title: "Key Fobs",
    formType: "objectList",
    fields: [
      { key: "fobNumber", label: "Fob number", placeholder: "e.g. FOB-8821" },
      { key: "description", label: "Description", placeholder: "Optional" },
    ],
    emptyTitle: "No key fobs on file",
    emptySubtitle: "Add your key fob numbers below.",
  },
  {
    section: "vehicles",
    moduleId: "vehicles",
    title: "Vehicles",
    formType: "objectList",
    maxItems: 2,
    fields: [
      { key: "make", label: "Make" },
      { key: "model", label: "Model" },
      { key: "year", label: "Year" },
      { key: "plate", label: "License plate" },
      { key: "color", label: "Color" },
    ],
    emptyTitle: "No vehicles on file",
    emptySubtitle: "You may register up to two vehicles.",
  },
  {
    section: "guestList",
    moduleId: "guestList",
    title: "Guest List",
    formType: "objectList",
    fields: [
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "email", label: "Email", type: "email" },
      { key: "notes", label: "Notes", placeholder: "Optional" },
    ],
    emptyTitle: "No guests on file",
    emptySubtitle: "Add guests who may need building access.",
  },
  {
    section: "bikeSpaces",
    moduleId: "bikeSpaces",
    title: "Bike Spaces",
    formType: "stringList",
    itemLabel: "Space number",
    placeholder: "e.g. B-7",
  },
  {
    section: "pets",
    moduleId: "pets",
    title: "Pets",
    formType: "objectList",
    maxItems: 2,
    fields: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type", placeholder: "Dog, Cat, etc." },
      { key: "breed", label: "Breed", placeholder: "Optional" },
      { key: "weight", label: "Weight", placeholder: "Optional" },
    ],
    emptyTitle: "No pets on file",
    emptySubtitle: "You may register up to two pets.",
  },
  {
    section: "purchaseDateMaintFees",
    moduleId: "purchaseDateMaintFees",
    title: "Condo Fees",
    formType: "single",
    fields: [
      { key: "purchaseDate", label: "Condo Fees", type: "text", placeholder: "e.g. Purchased 2019-06-15" },
      { key: "monthlyFee", label: "Monthly common expense fee", placeholder: "e.g. $485.00" },
      { key: "notes", label: "Notes", placeholder: "Optional" },
    ],
  },
];

export function getDetailSectionConfig(section: ResidentDetailSection): DetailSectionConfig {
  const config = RESIDENT_DETAIL_SECTIONS.find((c) => c.section === section);
  if (!config) throw new Error(`Unknown detail section: ${section}`);
  return config;
}

export function isDetailTileVisible(module: PortalModuleConfig): boolean {
  return Boolean(module.enabled && module.tileLabel);
}

export function routePageToDetailSection(page: string): ResidentDetailSection | null {
  const map: Record<string, ResidentDetailSection> = {
    "parking-spots": "parkingSpots",
    lockers: "lockers",
    "key-fobs": "keyFobs",
    vehicles: "vehicles",
    "guest-list": "guestList",
    "bike-spaces": "bikeSpaces",
    pets: "pets",
    "purchase-date-maint-fees": "purchaseDateMaintFees",
  };
  return map[page] ?? null;
}
