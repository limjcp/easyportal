import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FaCalendarAlt,
  FaCalendarCheck,
  FaCertificate,
  FaCommentDots,
  FaComments,
  FaEllipsisH,
  FaExclamationTriangle,
  FaFileAlt,
  FaFireExtinguisher,
  FaHome,
  FaImages,
  FaNewspaper,
  FaPoll,
  FaQuestionCircle,
  FaUserTie,
  FaVoteYea,
  FaWrench,
} from "react-icons/fa";
import { MobileBottomNav, type MobileBottomNavItem } from "../../shared/MobileBottomNav";
import { MobileDrawer } from "../../shared/MobileDrawer";
import { usePortalConfig } from "../context/PortalConfigContext";
import { isDetailTileVisible } from "../data/residentDetailConfig";
import { tileLabelToRoute, type ResidentRoute } from "../navigation";

const TILE_ICONS: Record<string, IconType> = {
  "News / Notices": FaNewspaper,
  Documents: FaFileAlt,
  "Incident Reports": FaExclamationTriangle,
  "Service Requests": FaWrench,
  Suggestions: FaCommentDots,
  Events: FaCalendarAlt,
  "Photo Gallery": FaImages,
  "Frequently Asked Questions": FaQuestionCircle,
  "Status Certificates": FaCertificate,
  Polls: FaPoll,
  "Become a Board Member": FaUserTie,
  "Board Elections": FaVoteYea,
  "Fire Safety Plan": FaFireExtinguisher,
  Chat: FaComments,
  "Amenity Bookings": FaCalendarCheck,
};

const PRIMARY_TILE_LABELS = ["News / Notices", "Service Requests", "Chat"] as const;

function isRouteActive(route: ResidentRoute, target: ResidentRoute): boolean {
  if (route.page !== target.page) return false;
  return true;
}

type ResidentBottomNavProps = {
  route: ResidentRoute;
  onNavigate: (route: ResidentRoute) => void;
};

export function ResidentBottomNav({ route, onNavigate }: ResidentBottomNavProps) {
  const { portalModules } = usePortalConfig();
  const [moreOpen, setMoreOpen] = useState(false);

  const enabledRoutes = portalModules
    .filter(
      (m) => m.enabled && m.tileLabel && tileLabelToRoute(m.tileLabel) && isDetailTileVisible(m)
    )
    .map((m) => ({
      label: m.tileLabel!,
      route: tileLabelToRoute(m.tileLabel!)!,
      icon: TILE_ICONS[m.tileLabel!] ?? FaEllipsisH,
    }));

  const primaryItems = [
    {
      id: "home",
      label: "Home",
      icon: FaHome,
      route: { page: "home" } as ResidentRoute,
      always: true,
    },
    ...PRIMARY_TILE_LABELS.map((label) => {
      const navRoute = tileLabelToRoute(label);
      const enabled = enabledRoutes.some((r) => r.label === label);
      return {
        id: label,
        label:
          label === "News / Notices" ? "News" : label === "Service Requests" ? "Requests" : "Chat",
        icon: TILE_ICONS[label] ?? FaEllipsisH,
        route: navRoute!,
        always: false,
        enabled,
      };
    }),
  ].filter((item) => item.always || item.enabled);

  const moreItems = enabledRoutes.filter(
    (r) => !PRIMARY_TILE_LABELS.includes(r.label as (typeof PRIMARY_TILE_LABELS)[number])
  );

  const bottomNavItems: MobileBottomNavItem[] = [
    ...primaryItems.map((item) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      active: isRouteActive(route, item.route),
      onClick: () => onNavigate(item.route),
    })),
    {
      id: "more",
      label: "More",
      icon: FaEllipsisH,
      active: moreItems.some((item) => isRouteActive(route, item.route)),
      onClick: () => setMoreOpen(true),
    },
  ];

  return (
    <>
      <div className="[&_nav]:border-white/20 [&_nav]:bg-[#1b1d20]/95 [&_button]:text-white/70 [&_button[aria-current=page]]:text-white">
        <MobileBottomNav items={bottomNavItems} />
      </div>
      <MobileDrawer open={moreOpen} onClose={() => setMoreOpen(false)} title="Portal menu" side="right">
        <nav className="p-2">
          {moreItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setMoreOpen(false);
                onNavigate(item.route);
              }}
              className={`mb-1 flex w-full items-center gap-3 rounded px-3 py-3 text-left text-sm transition ${
                isRouteActive(route, item.route)
                  ? "bg-[var(--portal-primary,#3476ef)] text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <item.icon />
              {item.label}
            </button>
          ))}
          {moreItems.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-slate-500">No additional modules enabled.</p>
          )}
        </nav>
      </MobileDrawer>
    </>
  );
}
