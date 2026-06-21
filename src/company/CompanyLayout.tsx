import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  FaBell,
  FaChevronDown,
  FaSignOutAlt,
  FaUser,
  FaUserCircle,
} from "react-icons/fa";
import { MvpLogo } from "../shared/MvpLogo";
import { Modal } from "../shared/Modal";
import { cn } from "../utils/cn";
import { companyRepository } from "./data/companyRepository";
import { CompanyProfileModal } from "./modals/CompanyProfileModal";
import { ManagementCompanyProfileModal } from "./modals/ManagementCompanyProfileModal";
import { companyNavItems, getCompanyBreadcrumbs, isCompanyNavActive } from "./navigation";
import type { CompanyRoute } from "./navigation";
import type { CompanyBuilding, CompanyNotification, CompanyUser } from "../resident/data/types";

type CompanyLayoutProps = {
  route: CompanyRoute;
  onNavigate: (route: CompanyRoute) => void;
  onLogout: () => void;
  onGoToWebsite?: () => void;
  user: CompanyUser;
  onUserUpdated?: (user: CompanyUser) => void;
  children: ReactNode;
  refreshKey?: number;
  activeBuilding?: CompanyBuilding | null;
  onCloseBuilding?: () => void;
};

export function CompanyLayout({
  route,
  onNavigate,
  onLogout,
  onGoToWebsite,
  user,
  onUserUpdated,
  children,
  refreshKey = 0,
  activeBuilding,
  onCloseBuilding,
}: CompanyLayoutProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [managementProfileOpen, setManagementProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<CompanyNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    companyRepository.getNotifications().then(setNotifications);
    companyRepository.getUnreadNotificationCount().then(setUnreadCount);
  }, [refreshKey]);

  useEffect(() => {
    if (!menuOpen && !notifOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen, notifOpen]);

  const breadcrumbs = getCompanyBreadcrumbs(route);

  const handleMarkRead = async (id: string) => {
    await companyRepository.markNotificationRead(id);
    const list = await companyRepository.getNotifications();
    const count = await companyRepository.getUnreadNotificationCount();
    setNotifications(list);
    setUnreadCount(count);
  };

  return (
    <div className="min-h-screen bg-[#e7edf3] text-slate-700">
      <div className="bg-[#7D5DA7] text-white shadow-sm">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-4 py-2 text-xs sm:px-6 sm:text-sm">
          <div className="flex items-center gap-2 font-semibold tracking-[0.08em]">
            <MvpLogo variant="navbar" />
          </div>
          <div className="flex items-center gap-3 text-white/90">
            {onGoToWebsite ? (
              <>
                <button
                  type="button"
                  onClick={onGoToWebsite}
                  className="transition hover:text-white"
                >
                  Website
                </button>
                <span className="text-white/50">|</span>
              </>
            ) : null}
            <a
              href="https://www.mvpmgmt.ca/"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-white"
            >
              Change Log
            </a>
            <span className="text-white/50">|</span>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="inline-flex items-center gap-2 rounded border border-white/30 bg-white/10 px-3 py-1 transition hover:bg-white/15"
              >
                Welcome back, {user.firstName}
                <FaChevronDown className="text-[10px]" />
              </button>
              {menuOpen && (
                <ul className="absolute right-0 z-50 mt-1 min-w-[180px] rounded border border-slate-200 bg-white py-1 text-sm text-slate-700 shadow-lg">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setProfileOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <FaUser className="text-slate-400" />
                      Your Profile
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
      </div>

      <div className="mx-auto max-w-[1080px] px-4 py-4 sm:px-6">
        <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 px-5 py-5 md:flex-row md:items-start">
            <MvpLogo />
            <div className="flex items-start gap-3 text-sm">
              <FaUserCircle className="mt-0.5 text-4xl text-slate-300" />
              <div>
                <p className="font-medium text-slate-700">{user.displayName}</p>
                <p className="font-semibold text-slate-900">{user.role}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setProfileOpen(true)}
                    className="rounded border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    Your Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setManagementProfileOpen(true)}
                    className="rounded border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    Management Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-0 bg-[#474747] text-center text-sm text-white sm:grid-cols-4 lg:grid-cols-7">
            {companyNavItems.map(({ id, label, icon: Icon, route: navRoute }) => (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(navRoute)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 border-r border-black/20 px-2 py-4 transition last:border-r-0",
                  isCompanyNavActive(route, id, !!activeBuilding) ? "bg-[#666666]" : "hover:bg-[#525252]"
                )}
              >
                <Icon className="text-lg" />
                <span className="text-xs sm:text-sm">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-[#b8d4e8] px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center gap-1 text-[#3476ef]">
              <button type="button" onClick={() => onNavigate({ page: "buildings" })} className="hover:underline">
                Back
              </button>
              <span className="text-slate-500">|</span>
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
            <div className="flex items-center gap-2">
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative rounded border border-slate-400 bg-white px-3 py-1 text-slate-700 hover:bg-slate-50"
                  aria-label="Notifications"
                >
                  <FaBell />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 z-50 mt-1 w-80 rounded border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                      Notifications
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-3 py-4 text-sm text-slate-500">No notifications.</p>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto">
                        {notifications.map((n) => (
                          <li key={n.id}>
                            <button
                              type="button"
                              onClick={() => handleMarkRead(n.id)}
                              className={cn(
                                "w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                                !n.read && "bg-blue-50 font-medium"
                              )}
                            >
                              {n.message}
                              <span className="mt-1 block text-xs text-slate-400">
                                {new Date(n.createdAt).toLocaleString()}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <a
                href="https://www.mvpmgmt.ca/contact-us"
                target="_blank"
                rel="noreferrer"
                className="rounded border border-slate-400 bg-white px-3 py-1 text-slate-700 hover:bg-slate-50"
              >
                Help
              </a>
            </div>
          </div>

          <div className="bg-[#ecf1f4] p-4">{children}</div>
        </div>
      </div>

      <CompanyProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        onSaved={onUserUpdated}
      />
      <ManagementCompanyProfileModal
        open={managementProfileOpen}
        onClose={() => setManagementProfileOpen(false)}
        onSaved={async () => {
          const refreshed = await companyRepository.getCompanyUser();
          onUserUpdated?.(refreshed);
        }}
      />

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
              className="rounded bg-[#3476ef] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d68cf]"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setLogoutOpen(false)}
              className="rounded border border-slate-300 px-6 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        }
      >
        <p className="text-center text-slate-600">Are you sure you want to logout?</p>
      </Modal>
    </div>
  );
}
