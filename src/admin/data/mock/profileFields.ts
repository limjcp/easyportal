import type { ProfileFieldOption } from "../../../resident/data/types";

export const seedProfileFieldOptions: ProfileFieldOption[] = [
  { fieldKey: "firstName", label: "First Name", show: true, editable: true, locked: true, note: "This field is enabled by default" },
  { fieldKey: "lastName", label: "Last Name", show: true, editable: true, locked: true, note: "This field is enabled by default" },
  { fieldKey: "email", label: "Email Address", show: true, editable: true, locked: true, note: "This field is enabled by default" },
  { fieldKey: "timezone", label: "Timezone", show: true, editable: true, locked: true, note: "This field is enabled by default" },
  { fieldKey: "homePhone", label: "Home Phone", show: true, editable: true, locked: true, note: "This field is enabled by default" },
  { fieldKey: "cellPhone", label: "Mobile Phone", show: true, editable: true, locked: true, note: "This field is enabled by default" },
  { fieldKey: "workPhone", label: "Business Phone", show: true, editable: true, locked: true, note: "This field is enabled by default" },
  { fieldKey: "guestList", label: "Guest List", show: true, editable: true, locked: false },
  { fieldKey: "emergency", label: "Emergency Contacts", show: true, editable: true, locked: false },
  { fieldKey: "pets", label: "Pets", show: true, editable: true, locked: false },
  { fieldKey: "parkingSpots", label: "Parking", show: true, editable: true, locked: false },
  { fieldKey: "lockers", label: "Lockers", show: true, editable: true, locked: false },
  { fieldKey: "keyFobs", label: "Key Fobs", show: true, editable: true, locked: false },
  { fieldKey: "bikeSpaces", label: "Bike Spaces", show: true, editable: true, locked: false },
  { fieldKey: "homeAddress", label: "Home Address", show: true, editable: true, locked: false },
  { fieldKey: "buzzerCode", label: "Buzzer Code", show: false, editable: false, locked: false },
  { fieldKey: "vehicles", label: "Vehicles", show: true, editable: true, locked: false },
  {
    fieldKey: "purchaseDateMaintFees",
    label: "Condo Fees",
    show: true,
    editable: true,
    locked: false,
  },
];
