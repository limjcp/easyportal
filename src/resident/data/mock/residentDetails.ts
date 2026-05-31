import type { ResidentProfileDetails } from "../types";

export const seedResidentDetails: ResidentProfileDetails = {
  parkingSpots: ["P-102A"],
  lockers: ["L-14"],
  keyFobs: [
    { id: "1", fobNumber: "FOB-8821", description: "Main entrance" },
    { id: "2", fobNumber: "FOB-8822", description: "Parking garage" },
  ],
  vehicles: [
    {
      id: "1",
      make: "Toyota",
      model: "Camry",
      year: "2021",
      plate: "ABCX 123",
      color: "Silver",
    },
  ],
  guestList: [
    {
      id: "1",
      name: "Maria Hayes",
      phone: "(519) 555-0199",
      email: "maria@example.com",
      notes: "Weekend guest access",
    },
  ],
  bikeSpaces: ["B-7"],
  pets: [
    { id: "1", name: "Buddy", type: "Dog", breed: "Golden Retriever", weight: "32 kg" },
  ],
  purchaseDateMaintFees: {
    purchaseDate: "2019-06-15",
    monthlyFee: "$485.00",
    notes: "Paid via pre-authorized debit",
    quickBooksBalance: "$132.45",
    nextPaymentAmount: "$485.00",
    nextPaymentDate: "2026-06-01",
    minimumOneTimePayment: "$485.00",
    paidMonths: ["2026-01", "2026-02", "2026-03"],
  },
};
