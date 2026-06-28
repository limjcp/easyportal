import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FaBars, FaChevronDown, FaSignOutAlt, FaUser, FaUserCircle } from "react-icons/fa";
import { MvpLogo } from "../shared/MvpLogo";
import { Modal } from "../shared/Modal";
import { MobileDrawer } from "../shared/MobileDrawer";
import { PageBusyProvider } from "../shared/PageBusyProvider";
import { PORTAL_MAIN_SECTION_CLASS, PORTAL_SHELL_CLASS } from "../shared/portalLayout";
import { useIsLgUp } from "../shared/useMediaQuery";
import { cn } from "../utils/cn";
import { AdminProfileModal } from "./modals/AdminProfileModal";
import { AdminSidebarNav } from "./components/AdminSidebarNav";
import { adminNavGroups, filterAdminNavGroups, formatBuildingOptionLabel, getPageTitle } from "./navigation";
import { adminRepository } from "./data/adminRepository";
import type { AdminUser, CompanyBuilding } from "../resident/data/types";
import type { AdminRoute } from "./navigation";

type AdminLayoutProps = {
  route: AdminRoute;
  onNavigate: (route: AdminRoute) => void;
  onSwitchToResident?: () => void;
  onLogout?: () => void;
  onGoToWebsite?: () => void;
  buildingLabel?: string;
  buildings?: CompanyBuilding[];
  activeBuildingId?: string;
  onSwitchBuilding?: (building: CompanyBuilding) => void;
  onOpenResidentPortal?: () => void;
  onBackToCompany?: () => void;
  onCloseBuilding?: () => void;
  embedded?: boolean;
  navAccess?: Map<string, boolean> | null;
  children: ReactNode;
};

export function AdminLayout({
  route,
  onNavigate,
  onSwitchToResident,
  onLogout,
  onGoToWebsite,
  buildingLabel,
  buildings,
  activeBuildingId,
  onSwitchBuilding,
  onOpenResidentPortal,
  onBackToCompany,
  onCloseBuilding,
  embedded = false,
  navAccess = null,
  children,
}: AdminLayoutProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [buildingMenuOpen, setBuildingMenuOpen] = useState(false);
  const isLgUp = useIsLgUp();
  const [profileUser, setProfileUser] = useState<Pick<AdminUser, "displayName" | "title">>({
    displayName: "Loading…",
    title: "",
  });
  const [resolvedBuildingLabel, setResolvedBuildingLabel] = useState<string | null>(null);
  const visibleNavGroups = useMemo(
    () => filterAdminNavGroups(adminNavGroups, navAccess),
    [navAccess]
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const buildingMenuRef = useRef<HTMLDivElement>(null);

  const closeBuilding = onCloseBuilding ?? onBackToCompany;
  const pageTitle = getPageTitle(route);

  const handleNavigate = (next: AdminRoute) => {
    setNavDrawerOpen(false);
    onNavigate(next);
  };

  useEffect(() => {
    if (!menuOpen && !buildingMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (buildingMenuRef.current && !buildingMenuRef.current.contains(e.target as Node)) {
        setBuildingMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen, buildingMenuOpen]);

  useEffect(() => {
    adminRepository
      .getAdminUser()
      .then((user) => setProfileUser({ displayName: user.displayName, title: user.title }))
      .catch(() => setProfileUser({ displayName: "Admin", title: "" }));
  }, []);

  useEffect(() => {
    if (buildingLabel) {
      setResolvedBuildingLabel(null);
      return;
    }
    adminRepository
      .getBuildingDefinition()
      .then((definition) => {
        const line = [definition.condoName, definition.address, definition.city].filter(Boolean).join(" — ");
        setResolvedBuildingLabel(line || "Building");
      })
      .catch(() => setResolvedBuildingLabel("Building"));
  }, [buildingLabel]);

  const displayBuildingLabel = buildingLabel ?? resolvedBuildingLabel ?? "Loading…";

  const openProfile = () => {
    setMenuOpen(false);
    setProfileOpen(true);
  };

  const showBuildingSelect = Boolean(buildings && buildings.length > 0 && onSwitchBuilding);
  const residentPortalAction = embedded ? onOpenResidentPortal : onSwitchToResident;

  const buildingBar = (
    <div className="border-b border-slate-300 bg-[#666666] px-2 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <div className="hidden shrink-0 rounded bg-[#424242] px-3 py-1.5 text-sm text-[#4ec0ff] sm:block">
          Home / Buildings /
        </div>
        {showBuildingSelect ? (
          <select
            value={activeBuildingId ?? ""}
            onChange={(e) => {
              const next = buildings!.find((b) => b.id === e.target.value);
              if (next) onSwitchBuilding!(next);
            }}
            className="min-w-0 flex-1 rounded border border-black/20 bg-white px-3 py-1.5 text-sm text-[#424242] shadow-inner"
          >
            {buildings!.map((b) => (
              <option key={b.id} value={b.id}>
                {formatBuildingOptionLabel(b)}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex min-w-0 flex-1 items-center justify-between rounded border border-black/20 bg-white px-3 py-1.5 text-[#424242] shadow-inner">
            <span className="truncate text-sm">{displayBuildingLabel}</span>
            <FaChevronDown className="shrink-0 text-[10px] text-slate-400" />
          </div>
        )}
        <div className="relative shrink-0 lg:hidden" ref={buildingMenuRef}>
          <button
            type="button"
            onClick={() => setBuildingMenuOpen((o) => !o)}
            className="rounded border border-white/30 bg-[#525252] px-2 py-1.5 text-sm text-white"
            aria-expanded={buildingMenuOpen}
            aria-haspopup="menu"
            aria-label="Building actions"
          >
            <FaChevronDown />
          </button>
          {buildingMenuOpen && (
            <ul
              role="menu"
              className="absolute right-0 z-50 mt-1 min-w-[200px] rounded border border-slate-200 bg-white py-1 text-sm text-slate-700 shadow-lg"
            >
              {!embedded && closeBuilding && (
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setBuildingMenuOpen(false);
                      closeBuilding();
                    }}
                    className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                  >
                    Close building view
                  </button>
                </li>
              )}
              {!embedded && onBackToCompany && (
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setBuildingMenuOpen(false);
                      onBackToCompany();
                    }}
                    className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                  >
                    Company Portal
                  </button>
                </li>
              )}
              {residentPortalAction && (
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setBuildingMenuOpen(false);
                      residentPortalAction();
                    }}
                    className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                  >
                    Resident Portal
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-2 hidden flex-wrap gap-2 lg:flex">
        {!embedded && closeBuilding && (
          <button
            type="button"
            onClick={closeBuilding}
            className="inline-flex items-center justify-center gap-2 rounded bg-[#5c2d91] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#4a2475]"
          >
            Close building view
          </button>
        )}
        {!embedded && onBackToCompany && (
          <button
            type="button"
            onClick={onBackToCompany}
            className="inline-flex items-center justify-center gap-2 rounded bg-[#5c2d91] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#4a2475]"
          >
            Company Portal
          </button>
        )}
        {residentPortalAction && (
          <button
            type="button"
            onClick={residentPortalAction}
            className="inline-flex items-center justify-center gap-2 rounded bg-[#89c64c] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#7ab543]"
          >
            Resident Portal
          </button>
        )}
      </div>
    </div>
  );

  const sidebarNav = (
    <AdminSidebarNav
      route={route}
      groups={visibleNavGroups}
      embedded={embedded}
      buildingId={activeBuildingId}
      onNavigate={handleNavigate}
    />
  );

  const mobileStickyBar = !isLgUp ? (
    <div className="sticky top-0 z-40 flex items-center gap-2 border-b border-slate-300 bg-[#8d8d8d] px-2 py-2 text-white lg:hidden">
      <button
        type="button"
        onClick={() => setNavDrawerOpen(true)}
        className="inline-flex shrink-0 items-center justify-center rounded bg-[#6e6e6e] p-2 hover:bg-[#626262]"
        aria-label="Open menu"
      >
        <FaBars />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{pageTitle}</h1>
      <button
        type="button"
        onClick={openProfile}
        className="inline-flex shrink-0 items-center justify-center rounded bg-[#6e6e6e] p-2 hover:bg-[#626262]"
        aria-label="Your profile"
      >
        <FaUser className="text-sm" />
      </button>
    </div>
  ) : null;

  const sidebarAndContent = (
    <div className="flex min-w-0 flex-col lg:flex-row lg:items-start">
      <aside className="hidden h-fit w-[220px] shrink-0 self-start border-r border-slate-300 bg-[#8d8d8d] lg:block">
        {sidebarNav}
        <div className="border-t border-white/10 p-2">
          <label className="flex items-center gap-2 rounded border border-black/10 bg-white px-2 py-1.5 text-sm text-slate-600">
            <span aria-hidden="true">🇺🇸</span>
            <select className="w-full bg-transparent outline-none">
              <option>English</option>
              <option>Français</option>
            </select>
          </label>
        </div>
      </aside>

      <section className={cn(PORTAL_MAIN_SECTION_CLASS, !isLgUp && "p-3")}>
        {mobileStickyBar}
        <div className="min-w-0 max-w-full">{children}</div>
      </section>

      <MobileDrawer
        open={navDrawerOpen}
        onClose={() => setNavDrawerOpen(false)}
        title="Building Admin"
        className="bg-[#8d8d8d]"
      >
        {sidebarNav}
        <div className="border-t border-white/10 p-2">
          <label className="flex items-center gap-2 rounded border border-black/10 bg-white px-2 py-1.5 text-sm text-slate-600">
            <span aria-hidden="true">🇺🇸</span>
            <select className="w-full bg-transparent outline-none">
              <option>English</option>
              <option>Français</option>
            </select>
          </label>
        </div>
      </MobileDrawer>
    </div>
  );

  const adminCard = (
    <div
      className={cn(
        "overflow-hidden bg-white",
        embedded ? "border-0 shadow-none" : "rounded-sm border border-slate-300 shadow-sm"
      )}
    >
      {!embedded && (
        <div className="hidden bg-white lg:block">
          <div className="flex flex-col justify-between gap-6 px-5 py-6 md:flex-row md:items-start">
            <MvpLogo />
            <AdminProfileCard
              displayName={profileUser.displayName}
              title={profileUser.title}
              onOpenProfile={openProfile}
            />
          </div>

          {onBackToCompany && !embedded && (
            <div className="border-b border-slate-300 bg-[#5c2d91] px-4 py-2 text-center text-sm text-white">
              <button type="button" onClick={onBackToCompany} className="font-medium hover:underline">
                ← Back to Company Portal
              </button>
            </div>
          )}
        </div>
      )}

      {buildingBar}
      {sidebarAndContent}
    </div>
  );

  if (embedded) {
    return (
      <PageBusyProvider>
        <div className="min-w-0">{adminCard}</div>
      </PageBusyProvider>
    );
  }

  return (
    <PageBusyProvider>
    <div className="min-h-screen bg-[#e7edf3] text-slate-700">
      <div className="bg-[#3476ef] text-white shadow-sm">
        <div className="mx-auto flex max-w-[2048px] items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6 sm:text-sm">
          <div className="flex min-w-0 items-center gap-3 font-semibold tracking-[0.12em] text-white/95">
            <MvpLogo variant="navbar" />
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
                className="inline-flex max-w-[10rem] items-center gap-1 rounded border border-white/30 bg-white/10 px-2 py-1 transition hover:bg-white/15 sm:max-w-none sm:gap-2 sm:px-3"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                Welcome, {profileUser.displayName.split(" ")[0]}
                <FaChevronDown className="text-[10px]" />
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
                      onClick={openProfile}
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

      <div className={cn(PORTAL_SHELL_CLASS, "py-4 sm:py-6")}>{adminCard}</div>

      <AdminProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onProfileSaved={(user) =>
          setProfileUser({ displayName: user.displayName, title: user.title })
        }
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
                if (onLogout) onLogout();
                else alert("Logged out (demo).");
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

function AdminProfileCard({
  displayName,
  title,
  onOpenProfile,
}: {
  displayName: string;
  title: string;
  onOpenProfile: () => void;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <FaUserCircle className="mt-0.5 text-4xl text-slate-300" />
      <div>
        <p className="font-medium text-slate-700">{displayName}</p>
        <p className="font-semibold text-slate-900">{title}</p>
        <button
          type="button"
          onClick={onOpenProfile}
          title="Click to edit your profile"
          className="mt-2 inline-flex items-center gap-2 rounded border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
        >
          <FaUserCircle className="text-sm text-slate-400" />
          Your Profile
        </button>
      </div>
    </div>
  );
}
