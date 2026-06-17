import type { IconType } from "react-icons";
import {
  FaCalendarAlt,
  FaCertificate,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaShoppingCart,
  FaUserPlus,
  FaUsers,
  FaWrench,
} from "react-icons/fa";
import type { MasterReportType } from "../../resident/data/types";

export type MasterReportHubTile = {
  id: MasterReportType;
  label: string;
  /** Legacy bootstrap btn-* color */
  btnClass: string;
  icon: IconType;
};

/** Tile order and styling aligned with legacy `/admin/masterReports/`. */
export const MASTER_REPORT_HUB_TILES: MasterReportHubTile[] = [
  {
    id: "amenity-reservations",
    label: "Amenity Reservations",
    btnClass: "bg-[#7b4bb7] hover:bg-[#6a419f]",
    icon: FaCalendarAlt,
  },
  {
    id: "board-approvals",
    label: "Board Approvals",
    btnClass: "bg-[#5cb85c] hover:bg-[#4cae4c]",
    icon: FaUsers,
  },
  {
    id: "building-store",
    label: "Building Store",
    btnClass: "bg-[#337ab7] hover:bg-[#2e6da4]",
    icon: FaShoppingCart,
  },
  {
    id: "certificates",
    label: "Certificates",
    btnClass: "bg-[#7b4bb7] hover:bg-[#6a419f]",
    icon: FaCertificate,
  },
  {
    id: "incident-reports",
    label: "Incident Reports",
    btnClass: "bg-[#d9534f] hover:bg-[#c9302c]",
    icon: FaExclamationTriangle,
  },
  {
    id: "chargebacks",
    label: "Chargebacks",
    btnClass: "bg-[#333333] hover:bg-[#222222]",
    icon: FaMoneyBillWave,
  },
  {
    id: "service-requests",
    label: "Service Requests",
    btnClass: "bg-[#f0ad4e] hover:bg-[#ec971f]",
    icon: FaWrench,
  },
  {
    id: "users-pending",
    label: "Users Pending",
    btnClass: "bg-[#337ab7] hover:bg-[#2e6da4]",
    icon: FaUsers,
  },
  {
    id: "portal-signups",
    label: "Portal Registrations",
    btnClass: "bg-[#5bc0de] hover:bg-[#46b8da]",
    icon: FaUserPlus,
  },
];
