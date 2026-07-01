import type { CertificateDetail, MasterReportRow } from "../../resident/data/types";

export function certificateDetailFromRow(row: MasterReportRow): CertificateDetail {
  const num = row.requestNumber ?? row.id;
  const delivery =
    row.processing === "VIP Rush Delivery"
      ? "VIP Rush Delivery 2 Day"
      : row.processing === "Rush Delivery"
        ? "Rush Delivery 5 Day"
        : "Regular Delivery 10 Day";

  return {
    id: row.id,
    requestNumber: num,
    sentBy: row.status === "Completed & Sent" ? undefined : undefined,
    sentAt: row.status === "Completed & Sent" ? undefined : undefined,
    unit: `${row.buildingLabel.split(" - ")[0] ?? row.buildingLabel} - Unit ${row.unit ?? "—"}`,
    dateCreated: row.date,
    deliveryType: delivery,
    dateDue: row.dueDate ?? "—",
    buildingName: row.buildingLabel.replace(/^\([^)]+\)\s*/, "").split(" - ")[0] ?? row.buildingLabel,
    buildingAddress: row.buildingLabel,
    buildingCityLine: "",
    requestedByName: row.title,
    requestedByPhone: "",
    requestedByEmail: "",
    parkingSlots: ["", ""],
    lockerSlots: ["", ""],
    sellerRetainsSeparatelyDeeded: false,
    ownersName: row.title,
    purchasersName: "",
    closingDate: row.closingDate ?? "",
    reasonForRequest: "Sale",
    solicitorName: "",
    solicitorPhone: "",
    solicitorFax: "",
    files: [],
    excludedFiles: [],
    history: [{ date: `${row.date} 10:30 AM`, user: row.title, action: "Ordered" }],
    archived: row.archived,
    unread: row.unread,
  };
}
