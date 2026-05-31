import type { RegistrationFieldOption } from "../../../resident/data/types";

export const seedRegistrationFieldOptions: RegistrationFieldOption[] = [
  { fieldKey: "firstName", label: "First Name", include: true, required: true, locked: true, note: "This field is required for an account and cannot be changed" },
  { fieldKey: "lastName", label: "Last Name", include: true, required: true, locked: true, note: "This field is required for an account and cannot be changed" },
  { fieldKey: "email", label: "Email Address", include: true, required: true, locked: true, note: "This field is required for an account and cannot be changed" },
  { fieldKey: "unit", label: "Unit", include: true, required: true, locked: true, note: "This field is required for an account and cannot be changed" },
  { fieldKey: "residentType", label: "Resident Type", include: true, required: true, locked: true, note: "This field is required for an account and cannot be changed" },
  { fieldKey: "TelHome", label: "Home Phone", include: false, required: false, locked: false },
  { fieldKey: "TelCell", label: "Cell Phone", include: false, required: false, locked: false },
  { fieldKey: "TelOffice", label: "Work Phone", include: false, required: false, locked: false },
  { fieldKey: "emergencyContacts", label: "Emergency Contact", include: false, required: false, locked: false, note: "Resident can only enter one contact on registration" },
  { fieldKey: "homeAddress", label: "Home Address", include: false, required: false, locked: false },
  { fieldKey: "vehicles", label: "Vehicles", include: false, required: false, locked: false, note: "Resident can only enter up to two vehicles on registration" },
  { fieldKey: "pets", label: "Pets", include: false, required: false, locked: false, note: "Resident can only enter up to two pets on registration" },
];
