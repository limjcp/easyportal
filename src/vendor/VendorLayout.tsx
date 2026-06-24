import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  FaChevronDown,
  FaSignOutAlt,
  FaUser,
  FaUserCircle,
} from "react-icons/fa";
import { MvpLogo } from "../shared/MvpLogo";
import { Modal } from "../shared/Modal";
import { PageBusyProvider } from "../shared/PageBusyProvider";
import { cn } from "../utils/cn";
import { VendorNotifications } from "./components/VendorNotifications";
import { vendorRepository } from "./data/vendorRepository";
import {
  getVendorBreadcrumbs,
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

  const breadcrumbs = getVendorBreadcrumbs(route);

  if (!sessionLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e7edf3] text-slate-600">
        Loading…
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
    <div className="min-h-screen bg-[#e7edf3] text-slate-700">
      <div className="bg-[#0d9488] text-white shadow-sm">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-4 py-2 text-xs sm:px-6 sm:text-sm">
          <span className="font-semibold tracking-[0.08em]">SUPPLIER / VENDOR PORTAL</span>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded border border-white/30 bg-white/10 px-3 py-1"
            >
              Welcome, {session.displayName.split(" ")[0]}
              <FaChevronDown className="text-[10px]" />
            </button>
            {menuOpen && (
              <ul className="absolute right-0 z-50 mt-1 min-w-[180px] rounded border border-slate-200 bg-white py-1 text-sm text-slate-700 shadow-lg">
                <li>
                  <button
                    type="button"
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
                <li className="my-1 border-t border-slate-100" />
                <li>
                  <button
                    type="button"
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
          <div className="flex flex-col justify-between gap-4 px-5 py-5 md:flex-row md:items-start">
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

          <div className="grid grid-cols-3 gap-0 bg-[#474747] text-center text-sm text-white">
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
            <div className="flex flex-wrap items-center gap-1 text-[#0d9488]">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-slate-400">/</span>}
                  {crumb.route ? (
                    <button type="button" onClick={() => onNavigate(crumb.route!)} className="hover:underline">
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-slate-700">{crumb.label}</span>
                  )}
                </span>
              ))}
            </div>
            <VendorNotifications refreshKey={refreshKey} onNavigate={onNavigate} />
          </div>

          <div className="bg-[#ecf1f4] p-4">{children}</div>
        </div>
      </div>

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
