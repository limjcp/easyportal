import {
  FaChevronRight,
  FaHome,
  FaNewspaper,
  FaFileAlt,
  FaExclamationTriangle,
  FaWrench,
  FaFile,
  FaCommentDots,
  FaCalendarAlt,
  FaImages,
  FaQuestionCircle,
  FaCertificate,
  FaComments,
  FaVoteYea,
} from "react-icons/fa";
import type { IconType } from "react-icons";
import { getBreadcrumbs, type ResidentRoute } from "../navigation";

const iconMap: Record<string, IconType> = {
  home: FaHome,
  news: FaNewspaper,
  documents: FaFileAlt,
  "incident-reports": FaExclamationTriangle,
  "service-requests": FaWrench,
  newsletters: FaFile,
  suggestions: FaCommentDots,
  events: FaCalendarAlt,
  gallery: FaImages,
  faq: FaQuestionCircle,
  "status-certificates": FaCertificate,
  "board-elections": FaVoteYea,
  "board-election-vote": FaVoteYea,
  chat: FaComments,
};

type ResidentNavProps = {
  route: ResidentRoute;
  onNavigate: (route: ResidentRoute) => void;
  rightAction?: import("react").ReactNode;
};

export function ResidentNav({ route, onNavigate, rightAction }: ResidentNavProps) {
  const crumbs = getBreadcrumbs(route);
  const showNav = route.page !== "home";

  if (!showNav) return null;

  return (
    <div className="bg-[#1b1d20]/95">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-2.5 sm:px-6">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-white/90">
          <button
            type="button"
            onClick={() => onNavigate({ page: "home" })}
            className="inline-flex items-center gap-1.5 transition hover:text-white"
          >
            <FaHome className="text-xs" />
            Home
          </button>
          {crumbs.map((crumb, i) => {
            const pageKey = crumb.route?.page ?? "home";
            const Icon = iconMap[pageKey] ?? FaChevronRight;
            return (
              <span key={i} className="inline-flex items-center gap-2">
                <span className="text-white/40">/</span>
                {crumb.route ? (
                  <button
                    type="button"
                    onClick={() => onNavigate(crumb.route!)}
                    className="inline-flex items-center gap-1.5 transition hover:text-white"
                  >
                    <Icon className="text-xs" />
                    {crumb.label}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-white">
                    <Icon className="text-xs" />
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
        {rightAction}
      </div>
    </div>
  );
}
