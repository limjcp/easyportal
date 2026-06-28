import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  FaCertificate,
  FaChevronDown,
  FaCog,
  FaFileInvoice,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUser,
  FaUserCircle,
} from "react-icons/fa";
import type { IconType } from "react-icons";
import { MvpLogo } from "../shared/MvpLogo";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { Modal } from "../shared/Modal";
import { MobileBottomNav, type MobileBottomNavItem } from "../shared/MobileBottomNav";
import { PageBusyProvider } from "../shared/PageBusyProvider";
import { cn } from "../utils/cn";
import { VendorNotifications } from "./components/VendorNotifications";
import { vendorRepository } from "./data/vendorRepository";
import {
  getVendorBreadcrumbs,
  getVendorPageTitle,
  isVendorNavActive,
  vendorNavItems,
} from "./navigation";
import type { VendorRoute } from "./navigation";
import type { VendorSession } from "../resident/data/types";

type VendorLayoutProps = {
  route: VendorRoute;
  onNavigate: (route: VendorRoute) => void;
  onLogout: () => void;
  refreshKey: number;
  children: ReactNode;
};

const PRIMARY_MOBILE_NAV_IDS = ["dashboard", "purchase-orders", "compliance"] as const;

const VENDOR_NAV_ICONS: Record<string, IconType> = {
  dashboard: FaTachometerAlt,
  "purchase-orders": FaFileInvoice,
  compliance: FaCertificate,
  "payment-settings": FaCog,
  profile: FaUser,
};

export function VendorLayout({
  route,
  onNavigate,
  onLogout,
  refreshKey,
  children,
}: VendorLayoutProps) {
  const [session, setSession] = useState<VendorSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = getVendorBreadcrumbs(route);
  const pageTitle = getVendorPageTitle(route);

  const moreNavItems = vendorNavItems.filter(
    (item) => !PRIMARY_MOBILE_NAV_IDS.includes(item.id as (typeof PRIMARY_MOBILE_NAV_IDS)[number])
  );

  const bottomNavItems: MobileBottomNavItem[] = [
    ...vendorNavItems
      .filter((item) =>
        PRIMARY_MOBILE_NAV_IDS.includes(item.id as (typeof PRIMARY_MOBILE_NAV_IDS)[number])
      )
      .map((item) => ({
        id: item.id,
        label: item.id === "purchase-orders" ? "Orders" : item.label,
        icon: VENDOR_NAV_ICONS[item.id] ?? FaUser,
        active: isVendorNavActive(route, item.id),
        onClick: () => onNavigate(item.route),
      })),
    ...moreNavItems.map((item) => ({
      id: item.id,
      label: item.label,
      icon: VENDOR_NAV_ICONS[item.id] ?? FaUser,
      active: isVendorNavActive(route, item.id),
      onClick: () => onNavigate(item.route),
    })),
  ];

  useEffect(() => {
    setSessionLoaded(false);
    void vendorRepository.getSession().then((nextSession) => {
      setSession(nextSession);
      setSessionLoaded(true);
    });
  }, [refreshKey]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  if (!sessionLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e7edf3]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#e7edf3] px-4 text-center text-slate-600">
        <p className="max-w-md text-sm">
          Unable to load your vendor account. Contact your property management company if you
          believe this is an error.
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="rounded bg-[#0d9488] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f766e]"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <PageBusyProvider>
      <div className="min-h-screen bg-[#e7edf3] pb-20 text-slate-700 lg:pb-0">
        <div className="bg-[#0d9488] text-white shadow-sm">
          <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6 sm:text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden font-semibold tracking-[0.08em] sm:inline">
                SUPPLIER / VENDOR PORTAL
              </span>
              <span className="truncate font-medium sm:hidden">{pageTitle}</span>
            </div>
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="inline-flex max-w-[9rem] items-center gap-1 rounded border border-white/30 bg-white/10 px-2 py-1 sm:max-w-none sm:gap-2 sm:px-3"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span className="truncate">Hi, {session.displayName.split(" ")[0]}</span>
                <FaChevronDown className="shrink-0 text-[10px]" />
              </button>
              {menuOpen && (
                <ul
                  role="menu"
                  className="absolute right-0 z-50 mt-1 min-w-[180px] rounded border border-slate-200 bg-white py-1 text-sm text-slate-700 shadow-lg"
                >
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onNavigate({ page: "payment-settings" });
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <FaUser className="text-slate-400" />
                      Payment Settings
                    </button>
                  </li>
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onNavigate({ page: "profile" });
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <FaUser className="text-slate-400" />
                      Profile
                    </button>
                  </li>
                  <li role="none" className="my-1 border-t border-slate-100" />
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setLogoutOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <FaSignOutAlt className="text-slate-400" />
                      Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1080px] px-4 py-4 sm:px-6">
          <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
            <div className="hidden flex-col justify-between gap-4 px-5 py-5 lg:flex md:flex-row md:items-start">
              <MvpLogo />
              <div className="flex items-start gap-3 text-sm">
                <FaUserCircle className="mt-0.5 text-4xl text-slate-300" />
                <div>
                  <p className="font-medium text-slate-700">{session.companyName}</p>
                  <p className="font-semibold text-slate-900">{session.tradeCategory}</p>
                  <p className="text-xs text-slate-500">{session.displayName}</p>
                </div>
              </div>
            </div>

            <div className="hidden grid-cols-5 gap-0 bg-[#474747] text-center text-sm text-white lg:grid">
              {vendorNavItems.map(({ id, label, route: navRoute }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onNavigate(navRoute)}
                  className={cn(
                    "border-r border-black/20 px-2 py-4 transition last:border-r-0",
                    isVendorNavActive(route, id) ? "bg-[#0d9488]" : "hover:bg-[#525252]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-[#d1fae5] px-3 py-2 text-sm">
              <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                <span className="truncate font-medium text-slate-700 lg:hidden">{pageTitle}</span>
                <div className="hidden flex-wrap items-center gap-1 text-[#0d9488] lg:flex">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <span className="text-slate-400">/</span>}
                      {crumb.route ? (
                        <button
                          type="button"
                          onClick={() => onNavigate(crumb.route!)}
                          className="hover:underline"
                        >
                          {crumb.label}
                        </button>
                      ) : (
                        <span className="text-slate-700">{crumb.label}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <VendorNotifications refreshKey={refreshKey} onNavigate={onNavigate} />
            </div>

            <div className="bg-[#ecf1f4] p-3 sm:p-4">{children}</div>
          </div>
        </div>

        <MobileBottomNav items={bottomNavItems} accent="teal" />

        <Modal
          open={logoutOpen}
          onClose={() => setLogoutOpen(false)}
          title="Logout"
          size="md"
          footer={
            <div className="flex w-full justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setLogoutOpen(false);
                  onLogout();
                }}
                className="rounded bg-[#0d9488] px-6 py-2 text-sm font-medium text-white hover:bg-[#0f766e]"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                className="rounded border border-slate-300 px-6 py-2 text-sm text-slate-600"
              >
                Cancel
              </button>
            </div>
          }
        >
          <p className="text-center text-slate-600">Are you sure you want to logout?</p>
        </Modal>
      </div>
    </PageBusyProvider>
  );
}
