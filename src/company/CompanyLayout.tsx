import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  FaBell,
  FaChevronDown,
  FaEllipsisH,
  FaSignOutAlt,
  FaUser,
  FaUserCircle,
} from "react-icons/fa";
import { MvpLogo } from "../shared/MvpLogo";
import { Modal } from "../shared/Modal";
import { MobileBottomNav, type MobileBottomNavItem } from "../shared/MobileBottomNav";
import { MobileDrawer } from "../shared/MobileDrawer";
import { PageBusyProvider } from "../shared/PageBusyProvider";
import { PORTAL_CONTENT_PAD_CLASS, PORTAL_SHELL_CLASS } from "../shared/portalLayout";
import { useIsLgUp } from "../shared/useMediaQuery";
import { cn } from "../utils/cn";
import { companyRepository } from "./data/companyRepository";
import { CompanyProfileModal } from "./modals/CompanyProfileModal";
import { ManagementCompanyProfileModal } from "./modals/ManagementCompanyProfileModal";
import {
  companyNavItems,
  getCompanyBreadcrumbs,
  getCompanyPageTitle,
  isCompanyNavActive,
} from "./navigation";
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

const PRIMARY_MOBILE_NAV_IDS = ["buildings", "master-reports", "purchase-orders", "chat"] as const;

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
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<CompanyNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const isLgUp = useIsLgUp();
  const breadcrumbs = getCompanyBreadcrumbs(route);
  const pageTitle = getCompanyPageTitle(route);
  // Mobile: hide company chrome when embedded admin is open. Desktop: keep top nav visible.
  const showCompanyChrome = !activeBuilding || isLgUp;

  const moreNavItems = companyNavItems.filter(
    (item) => !PRIMARY_MOBILE_NAV_IDS.includes(item.id as (typeof PRIMARY_MOBILE_NAV_IDS)[number])
  );

  const bottomNavItems: MobileBottomNavItem[] = [
    ...companyNavItems
      .filter((item) =>
        PRIMARY_MOBILE_NAV_IDS.includes(item.id as (typeof PRIMARY_MOBILE_NAV_IDS)[number])
      )
      .map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        active: isCompanyNavActive(route, item.id, !!activeBuilding),
        onClick: () => onNavigate(item.route),
      })),
    {
      id: "more",
      label: "More",
      icon: FaEllipsisH,
      active: moreNavItems.some((item) => isCompanyNavActive(route, item.id, !!activeBuilding)),
      onClick: () => setMoreDrawerOpen(true),
    },
  ];

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

  const handleMoreNavigate = (navRoute: CompanyRoute) => {
    setMoreDrawerOpen(false);
    onNavigate(navRoute);
  };

  const handleMarkRead = async (id: string) => {
    await companyRepository.markNotificationRead(id);
    const list = await companyRepository.getNotifications();
    const count = await companyRepository.getUnreadNotificationCount();
    setNotifications(list);
    setUnreadCount(count);
  };

  return (
    <PageBusyProvider>
      <div
        className={cn(
          "min-h-screen bg-[#e7edf3] text-slate-700",
          showCompanyChrome && "pb-20 lg:pb-0"
        )}
      >
        <div className="bg-[#7D5DA7] text-white shadow-sm">
          <div
            className={cn(
              PORTAL_SHELL_CLASS,
              "flex items-center justify-between gap-2 py-2 text-xs sm:text-sm"
            )}
          >
            <div className="flex min-w-0 items-center gap-2 font-semibold tracking-[0.08em]">
              <MvpLogo variant="navbar" />
              {showCompanyChrome && (
                <span className="truncate text-sm font-medium lg:hidden">{pageTitle}</span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 text-white/90 sm:gap-3">
              {onGoToWebsite ? (
                <>
                  <button
                    type="button"
                    onClick={onGoToWebsite}
                    className="hidden transition hover:text-white sm:inline"
                  >
                    Website
                  </button>
                  <span className="hidden text-white/50 sm:inline">|</span>
                </>
              ) : null}
              <a
                href="https://www.mvpmgmt.ca/"
                target="_blank"
                rel="noreferrer"
                className="hidden transition hover:text-white sm:inline"
              >
                Change Log
              </a>
              <span className="hidden text-white/50 sm:inline">|</span>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="inline-flex max-w-[9rem] items-center gap-1 rounded border border-white/30 bg-white/10 px-2 py-1 transition hover:bg-white/15 sm:max-w-none sm:gap-2 sm:px-3"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className="truncate">Hi, {user.firstName}</span>
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
                          setProfileOpen(true);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                      >
                        <FaUser className="text-slate-400" />
                        Your Profile
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
        </div>

        <div className={cn(PORTAL_SHELL_CLASS, "py-4")}>
          <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
            {showCompanyChrome && (
              <div className="hidden flex-col justify-between gap-4 px-5 py-5 lg:flex md:flex-row md:items-start">
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
            )}

            {showCompanyChrome && (
              <div className="hidden grid-cols-7 gap-0 bg-[#474747] text-center text-sm text-white lg:grid">
                {companyNavItems.map(({ id, label, icon: Icon, route: navRoute }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onNavigate(navRoute)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 border-r border-black/20 px-2 py-4 transition last:border-r-0",
                      isCompanyNavActive(route, id, !!activeBuilding)
                        ? "bg-[#666666]"
                        : "hover:bg-[#525252]"
                    )}
                  >
                    <Icon className="text-lg" />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {showCompanyChrome && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-[#b8d4e8] px-3 py-2 text-sm">
                <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-[#3476ef]">
                  <button
                    type="button"
                    onClick={() => onNavigate({ page: "buildings" })}
                    className="shrink-0 hover:underline"
                  >
                    Back
                  </button>
                  <span className="shrink-0 text-slate-500">|</span>
                  <span className="truncate text-slate-700 lg:hidden">{pageTitle}</span>
                  <div className="hidden flex-wrap items-center gap-1 lg:flex">
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
                <div className="flex shrink-0 items-center gap-2">
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
                      <div className="absolute right-0 z-50 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded border border-slate-200 bg-white shadow-lg">
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
            )}

            {activeBuilding && onCloseBuilding && (
              <div className="flex items-center justify-between border-b border-slate-300 bg-[#b8d4e8] px-3 py-2 text-sm lg:hidden">
                <span className="truncate font-medium text-slate-700">
                  {activeBuilding.code} — {activeBuilding.address}
                </span>
                <button
                  type="button"
                  onClick={onCloseBuilding}
                  className="shrink-0 rounded bg-[#5c2d91] px-3 py-1 text-xs font-medium text-white"
                >
                  Close
                </button>
              </div>
            )}

            <div
              className={cn(
                "bg-[#ecf1f4]",
                activeBuilding ? "p-0" : PORTAL_CONTENT_PAD_CLASS,
                showCompanyChrome && "pb-2 lg:pb-0"
              )}
            >
              {children}
            </div>
          </div>
        </div>

        {showCompanyChrome && <MobileBottomNav items={bottomNavItems} />}

        <MobileDrawer
          open={moreDrawerOpen}
          onClose={() => setMoreDrawerOpen(false)}
          title="More"
          side="right"
        >
          <nav className="p-2">
            {moreNavItems.map(({ id, label, icon: Icon, route: navRoute }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleMoreNavigate(navRoute)}
                className={cn(
                  "mb-1 flex w-full items-center gap-3 rounded px-3 py-3 text-left text-sm transition",
                  isCompanyNavActive(route, id, !!activeBuilding)
                    ? "bg-[#7D5DA7] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <Icon />
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setMoreDrawerOpen(false);
                setManagementProfileOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              <FaUserCircle />
              Management Profile
            </button>
          </nav>
        </MobileDrawer>

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
    </PageBusyProvider>
  );
}
