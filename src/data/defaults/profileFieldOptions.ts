import type { ProfileFieldOption } from "../../resident/data/types";

export const DEFAULT_PROFILE_FIELD_OPTIONS: ProfileFieldOption[] = [
  { fieldKey: "firstName", label: "First Name", show: true, editable: true, locked: true, note: "This field is enabled by default", requiredForCompletion: false },
  { fieldKey: "lastName", label: "Last Name", show: true, editable: true, locked: true, note: "This field is enabled by default", requiredForCompletion: false },
  { fieldKey: "email", label: "Email Address", show: true, editable: true, locked: true, note: "This field is enabled by default", requiredForCompletion: false },
  { fieldKey: "timezone", label: "Timezone", show: true, editable: true, locked: true, note: "This field is enabled by default", requiredForCompletion: false },
  { fieldKey: "homePhone", label: "Home Phone", show: true, editable: true, locked: true, note: "This field is enabled by default", requiredForCompletion: false },
  { fieldKey: "cellPhone", label: "Mobile Phone", show: true, editable: true, locked: true, note: "This field is enabled by default", requiredForCompletion: false },
  { fieldKey: "workPhone", label: "Business Phone", show: true, editable: true, locked: true, note: "This field is enabled by default", requiredForCompletion: false },
  { fieldKey: "guestList", label: "Guest List", show: true, editable: true, locked: false, requiredForCompletion: false },
  { fieldKey: "emergency", label: "Emergency Contacts", show: true, editable: true, locked: false, requiredForCompletion: false },
  { fieldKey: "pets", label: "Pets", show: true, editable: true, locked: false, requiredForCompletion: false },
  { fieldKey: "parkingSpots", label: "Parking", show: true, editable: true, locked: false, requiredForCompletion: false },
  { fieldKey: "lockers", label: "Lockers", show: true, editable: true, locked: false, requiredForCompletion: false },
  { fieldKey: "keyFobs", label: "Key Fobs", show: true, editable: true, locked: false, requiredForCompletion: false },
  { fieldKey: "bikeSpaces", label: "Bike Spaces", show: true, editable: true, locked: false, requiredForCompletion: false },
  { fieldKey: "homeAddress", label: "Home Address", show: true, editable: true, locked: false, requiredForCompletion: false },
  { fieldKey: "buzzerCode", label: "Buzzer Code", show: false, editable: false, locked: false, requiredForCompletion: false },
  { fieldKey: "vehicles", label: "Vehicles", show: true, editable: true, locked: false, requiredForCompletion: false },
  {
    fieldKey: "purchaseDateMaintFees",
    label: "Condo Fees",
    show: true,
    editable: true,
    locked: false,
    requiredForCompletion: false,
  },
];
