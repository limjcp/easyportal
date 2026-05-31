import { PARKING_PAYMENT_AMOUNTS, type ParkingRequest } from "../types";

export const seedParkingRequests: ParkingRequest[] = [
  {
    id: "parking-req-1",
    residentId: "1",
    residentName: "Claudio",
    unit: "102",
    requestType: "parking",
    status: "approvedAwaitingPayment",
    requestedAt: "2026-05-26T09:15:00.000Z",
    assignedSpot: "P-103A",
    approvedAt: "2026-05-26T10:00:00.000Z",
    paymentAmount: PARKING_PAYMENT_AMOUNTS.parking,
    monthlyCost: "$120.00",
    paymentTypeLabel: "Regular Parking",
    requestedForNights: "Weeknights",
  },
  {
    id: "parking-req-2",
    residentId: "1",
    residentName: "Claudio",
    unit: "102",
    requestType: "visitor",
    status: "waiting",
    requestedAt: "2026-05-27T08:30:00.000Z",
    monthlyCost: "$30.00",
    requestedForNights: "Overnight Saturday",
  },
];
