import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FaChevronDown, FaSignOutAlt, FaUser, FaUserCircle } from "react-icons/fa";
import { MvpLogo } from "../shared/MvpLogo";
import { Modal } from "../shared/Modal";
import { AdminProfileModal } from "./modals/AdminProfileModal";
import { AdminSidebarNav } from "./components/AdminSidebarNav";
import { adminNavGroups, filterAdminNavGroups, formatBuildingOptionLabel } from "./navigation";
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

  const closeBuilding = onCloseBuilding ?? onBackToCompany;

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
    <div className="flex flex-col gap-2 border-b border-slate-300 bg-[#666666] px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm">
        <div className="shrink-0 rounded bg-[#424242] px-3 py-1.5 text-[#4ec0ff]">Home / Buildings /</div>
        {showBuildingSelect ? (
          <select
            value={activeBuildingId ?? ""}
            onChange={(e) => {
              const next = buildings.find((b) => b.id === e.target.value);
              if (next) onSwitchBuilding(next);
            }}
            className="min-w-[200px] max-w-full flex-1 rounded border border-black/20 bg-white px-3 py-1.5 text-sm text-[#424242] shadow-inner"
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {formatBuildingOptionLabel(b)}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex min-w-[200px] flex-1 items-center justify-between rounded border border-black/20 bg-white px-3 py-1.5 text-[#424242] shadow-inner">
            <span className="truncate text-sm">{displayBuildingLabel}</span>
            <FaChevronDown className="shrink-0 text-[10px] text-slate-400" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
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

  const sidebarAndContent = (
    <div className="flex min-w-0 flex-col lg:flex-row lg:items-start">
      <aside className="h-fit w-full shrink-0 self-start border-r border-slate-300 bg-[#8d8d8d] lg:w-[220px]">
        <AdminSidebarNav
          route={route}
          groups={visibleNavGroups}
          embedded={embedded}
          buildingId={activeBuildingId}
          onNavigate={onNavigate}
        />
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

      <section className="min-w-0 flex-1 overflow-x-auto bg-[#ecf1f4] p-3 sm:p-4">
        <div className="min-w-0 max-w-full">{children}</div>
      </section>
    </div>
  );

  const adminCard = (
    <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
      {!embedded && (
        <div className="bg-white">
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
    return <div className="min-w-0">{adminCard}</div>;
  }

  return (
    <div className="min-h-screen bg-[#e7edf3] text-slate-700">
      <div className="bg-[#3476ef] text-white shadow-sm">
        <div className="mx-auto flex max-w-[2048px] items-center justify-between px-4 py-2 text-xs sm:px-6 sm:text-sm">
          <div className="flex items-center gap-3 font-semibold tracking-[0.12em] text-white/95">
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
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                Welcome back, {profileUser.displayName.split(" ")[0]}
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

      <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-6 sm:py-6">{adminCard}</div>

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
