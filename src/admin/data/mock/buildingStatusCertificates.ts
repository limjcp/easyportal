import type { MasterReportRow } from "../../../resident/data/types";

export const ECC3_BUILDING_ID = "2125709899";
const ECC3_LABEL = "(ECC 3) 301 Carlow Road - ECC3";

function row(
  id: string,
  date: string,
  title: string,
  status: string,
  archived: boolean,
  extra?: Partial<MasterReportRow>
): MasterReportRow {
  return {
    id,
    reportType: "certificates",
    buildingId: ECC3_BUILDING_ID,
    buildingLabel: ECC3_LABEL,
    date,
    title,
    status,
    archived,
    ...extra,
  };
}

/** ECC 3 status certificate requests (building admin portal). */
export const seedBuildingCertificateRequests: MasterReportRow[] = [
  row("cert-ecc3-1020", "2026-05-11", "Maria Santos", "Completed & Sent", false, {
    requestNumber: "1020",
    processing: "Regular Delivery",
    unit: "12",
    dueDate: "2026-05-26",
    closingDate: "",
  }),
  row("cert-ecc3-1021", "2026-05-11", "Dave Campbell", "Completed & Sent", false, {
    requestNumber: "1021",
    processing: "Regular Delivery",
    unit: "8",
    dueDate: "2026-05-26",
    unread: true,
  }),
  row("cert-ecc3-1022", "2026-05-11", "Robert Chen", "Completed & Sent", false, {
    requestNumber: "1022",
    processing: "VIP Rush Delivery",
    unit: "20",
    dueDate: "2026-05-13",
    unread: true,
  }),
  row("cert-ecc3-1019", "2026-05-05", "Jennifer Walsh", "In Progress", false, {
    requestNumber: "1019",
    processing: "Rush Delivery",
    unit: "5",
    dueDate: "2026-05-10",
    closingDate: "2026-05-15",
  }),
  row("cert-ecc3-1018", "2026-04-24", "Michael Torres", "Pending Review", false, {
    requestNumber: "1018",
    processing: "Regular Delivery",
    unit: "3",
    dueDate: "2026-05-08",
    closingDate: "2026-05-20",
    unread: true,
  }),
  row("cert-ecc3-1017", "2026-04-10", "Lisa Nguyen", "Completed & Sent", true, {
    requestNumber: "1017",
    processing: "VIP Rush Delivery",
    unit: "15",
    dueDate: "2026-04-13",
    statusExtra: "Viewed by Purchaser",
  }),
  row("cert-ecc3-1016", "2026-04-01", "James O'Brien", "Completed & Sent", true, {
    requestNumber: "1016",
    processing: "Regular Delivery",
    unit: "7",
    dueDate: "2026-04-16",
    statusExtra: "Viewed by Purchaser",
  }),
  row("cert-ecc3-1015", "2025-11-12", "Patricia Gomez", "Completed & Sent", true, {
    requestNumber: "1015",
    processing: "Regular Delivery",
    unit: "2",
    dueDate: "2025-11-27",
    statusExtra: "Viewed by Purchaser",
  }),
];
