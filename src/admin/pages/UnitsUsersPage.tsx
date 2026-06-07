import { type ReactNode, useEffect, useMemo, useState } from "react";
import { FaBuilding, FaCheck, FaUser } from "react-icons/fa";
import { OptionsDropdown } from "../components/AdminBadges";
import { AdminPanelTable, AdminTabs, type AdminTableColumn } from "../components/AdminPanelTable";
import { resetPasswordForEmail } from "../../auth/supabaseAuth";
import { adminRepository } from "../data/adminRepository";
import { BUILDING_ADMIN_ROLES } from "../data/mock/buildingPermissions";
import { Modal } from "../../shared/Modal";
import { unitDetailDirty, userDetailDirty } from "../../shared/formDirty";
import { useToast } from "../../shared/Toast";
import {
  cloneUnitDetail,
  cloneUserDetail,
  updatePrimaryUnitProfileSection,
  updateUserProfileSection,
} from "../utils/profileSectionAdd";
import type { ResidentDetailSection } from "../../resident/data/types";
import { ResidentTypePortalModulesModal } from "../modals/ResidentTypePortalModulesModal";
import { FaEdit } from "react-icons/fa";
import type {
  UnitsUsersAccountStatus,
  UnitsUsersArchivedRow,
  UnitsUsersCurrentRow,
  UnitsUsersPendingRow,
  UnitsUsersResidentType,
  UnitsUsersTab,
  UnitsUsersUnoccupiedRow,
  UnitsUsersUnitDetail,
  UnitsUsersUserDetail,
} from "../../resident/data/types";

type UnitsUsersPageProps = {
  refreshKey: number;
  onRefresh: () => void;
};

const TABS: { id: UnitsUsersTab; label: string }[] = [
  { id: "current", label: "Current Users" },
  { id: "pending", label: "Users Pending Assignment" },
  { id: "unoccupied", label: "Unoccupied Units" },
  { id: "archived", label: "Archived Users" },
];

const USER_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "View All" },
  { value: "Owner", label: "Owner" },
  { value: "Tenant", label: "Tenant" },
  { value: "Absentee Owner", label: "Absentee Owner" },
  { value: "Occupant", label: "Occupant" },
  { value: "Unit Manager", label: "Unit Manager" },
];

const RESIDENT_TYPE_OPTIONS = USER_TYPE_OPTIONS.filter((option) => option.value !== "");

type UserDetailTab = "details" | "extended" | "notes" | "external" | "account" | "permissions";

const USER_DETAIL_TABS: { id: UserDetailTab; label: string }[] = [
  { id: "details", label: "User Details" },
  { id: "extended", label: "Extended Info" },
  { id: "permissions", label: "Permissions" },
  { id: "notes", label: "Notes" },
  { id: "external", label: "External Data" },
  { id: "account", label: "Account Balance" },
];

function formatCount(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function statusColor(status: string) {
  if (status === "Activated") return "bg-[#5cb85c]";
  if (status === "Awaiting Activation") return "bg-blue-600";
  if (status === "Pending Unit Assignment") return "bg-[#f0ad4e]";
  if (status === "Record-Only") return "bg-slate-600";
  if (status === "Archived") return "bg-slate-500";
  if (status === "Deleted") return "bg-red-600";
  return "bg-slate-500";
}

function StatusCell({ status, tags }: { status: string; tags: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      <span className={`rounded px-2 py-0.5 text-xs text-white ${statusColor(status)}`}>{status}</span>
      {tags.map((tag) => (
        <span key={tag} className="rounded bg-[#5cb85c] px-2 py-0.5 text-xs text-white">
          {tag}
        </span>
      ))}
    </div>
  );
}

function emailCell(email: string) {
  return (
    <a href={`mailto:${email}`} className="text-[#3476ef] hover:underline">
      {email}
    </a>
  );
}

function UnitSectionPanel({
  title,
  actionLabel = "Add",
  emptyMessage,
  items,
  onAdd,
  readOnly = false,
}: {
  title: string;
  actionLabel?: string;
  emptyMessage: string;
  items: string[];
  onAdd?: () => void;
  readOnly?: boolean;
}) {
  return (
    <div className="rounded border border-slate-300 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-3 py-2">
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        {!readOnly && onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="rounded bg-[#7D5DA7] px-2 py-1 text-xs text-white hover:bg-[#6d4d97]"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="p-3 text-sm">
        {items.length === 0 ? (
          <p className="text-center text-slate-500">{emptyMessage}</p>
        ) : (
          <ul className="space-y-1 text-slate-700">
            {items.map((item, index) => (
              <li key={`${title}-${index}`}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function UnitSummaryLink({
  badgeClass,
  count,
  label,
  clickable = false,
}: {
  badgeClass: string;
  count: number;
  label: string;
  clickable?: boolean;
}) {
  const content: ReactNode = (
    <>
      <span className={`mr-2 rounded px-2 py-0.5 text-xs text-white ${badgeClass}`}>{count}</span>
      {label}
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        className="text-left text-[#3476ef] hover:underline"
        onClick={() => window.alert("Linked report view is mock-only in this phase.")}
      >
        {content}
      </button>
    );
  }

  return <p className="text-slate-700">{content}</p>;
}

function LegacyToggleRow({ label, enabled }: { label: string; enabled?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={!!enabled} readOnly className="h-4 w-4 rounded border-slate-300" />
      <span>{label}</span>
    </label>
  );
}

export function UnitsUsersPage({ refreshKey, onRefresh }: UnitsUsersPageProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<UnitsUsersTab>("current");
  const [currentRows, setCurrentRows] = useState<UnitsUsersCurrentRow[]>([]);
  const [pendingRows, setPendingRows] = useState<UnitsUsersPendingRow[]>([]);
  const [unoccupiedRows, setUnoccupiedRows] = useState<UnitsUsersUnoccupiedRow[]>([]);
  const [archivedRows, setArchivedRows] = useState<UnitsUsersArchivedRow[]>([]);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortKey, setSortKey] = useState("unit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [selectedUnit, setSelectedUnit] = useState<UnitsUsersUnitDetail | null>(null);
  const [unitDraft, setUnitDraft] = useState<UnitsUsersUnitDetail | null>(null);
  const [unitDetailBaseline, setUnitDetailBaseline] = useState<UnitsUsersUnitDetail | null>(null);
  const [selectedUser, setSelectedUser] = useState<UnitsUsersUserDetail | null>(null);
  const [userDraft, setUserDraft] = useState<UnitsUsersUserDetail | null>(null);
  const [userDetailBaseline, setUserDetailBaseline] = useState<UnitsUsersUserDetail | null>(null);
  const [userDetailTab, setUserDetailTab] = useState<UserDetailTab>("details");
  const [addResidentOpen, setAddResidentOpen] = useState(false);
  const [typePortalModulesOpen, setTypePortalModulesOpen] = useState(false);

  const [newResidentUnit, setNewResidentUnit] = useState("");
  const [newResidentType, setNewResidentType] = useState<UnitsUsersResidentType>("Owner");
  const [newResidentFirstName, setNewResidentFirstName] = useState("");
  const [newResidentLastName, setNewResidentLastName] = useState("");
  const [newResidentEmail, setNewResidentEmail] = useState("");
  const [newResidentPassword, setNewResidentPassword] = useState("");
  const [newResidentPasswordConfirm, setNewResidentPasswordConfirm] = useState("");
  const [assignUnitOpen, setAssignUnitOpen] = useState(false);
  const [assignOccupancyId, setAssignOccupancyId] = useState("");
  const [assignUnitId, setAssignUnitId] = useState("");
  const [assignableUnits, setAssignableUnits] = useState<Array<{ id: string; label: string }>>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reloadLists = () => onRefresh();

  const isUserDetailDirty = useMemo(
    () => userDetailDirty(userDetailBaseline, userDraft),
    [userDetailBaseline, userDraft]
  );

  const isUnitDetailDirty = useMemo(
    () => unitDetailDirty(unitDetailBaseline, unitDraft),
    [unitDetailBaseline, unitDraft]
  );

  useEffect(() => {
    Promise.all([
      adminRepository.getUnitsUsersCurrent(),
      adminRepository.getUnitsUsersPending(),
      adminRepository.getUnitsUsersUnoccupied(),
      adminRepository.getUnitsUsersArchived(),
    ]).then(([current, pending, unoccupied, archived]) => {
      setCurrentRows(current);
      setPendingRows(pending);
      setUnoccupiedRows(unoccupied);
      setArchivedRows(archived);
    });
  }, [refreshKey]);

  useEffect(() => {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
    setSortDir("asc");
    setPage(1);
    if (activeTab === "current") setSortKey("unit");
    if (activeTab === "pending") setSortKey("name");
    if (activeTab === "unoccupied") setSortKey("unit");
    if (activeTab === "archived") setSortKey("name");
  }, [activeTab]);

  const counts = useMemo(() => {
    const owners = currentRows.filter((row) => row.type === "Owner").length;
    const tenants = currentRows.filter((row) => row.type === "Tenant").length;
    const occupants = currentRows.filter((row) => row.type === "Occupant").length;
    return { owners, tenants, occupants };
  }, [currentRows]);

  const statusOptions = useMemo(() => {
    if (activeTab === "unoccupied") return [];
    const source =
      activeTab === "current"
        ? currentRows.map((row) => row.status)
        : activeTab === "pending"
          ? pendingRows.map((row) => row.status)
          : archivedRows.map((row) => row.status);
    const unique = Array.from(new Set(source)).sort((a, b) => a.localeCompare(b));
    return [{ value: "", label: "View All" }, ...unique.map((value) => ({ value, label: value }))];
  }, [activeTab, archivedRows, currentRows, pendingRows]);

  const filteredCurrentRows = useMemo(
    () =>
      currentRows.filter((row) => {
        if (statusFilter && row.status !== statusFilter) return false;
        if (typeFilter && row.type !== typeFilter) return false;
        return true;
      }),
    [currentRows, statusFilter, typeFilter]
  );

  const filteredPendingRows = useMemo(
    () =>
      pendingRows.filter((row) => {
        if (statusFilter && row.status !== statusFilter) return false;
        if (typeFilter && row.type !== typeFilter) return false;
        return true;
      }),
    [pendingRows, statusFilter, typeFilter]
  );

  const filteredArchivedRows = useMemo(
    () =>
      archivedRows.filter((row) => {
        if (statusFilter && row.status !== statusFilter) return false;
        if (typeFilter && row.type !== typeFilter) return false;
        return true;
      }),
    [archivedRows, statusFilter, typeFilter]
  );

  const unitOptions = useMemo(() => {
    const options = new Map<string, string>();
    currentRows.forEach((row) => options.set(row.unitId, row.unitLabel));
    unoccupiedRows.forEach((row) => options.set(row.unitId, row.unitLabel));
    return Array.from(options.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [currentRows, unoccupiedRows]);

  const openUnitDetail = (unitId: string) => {
    setActionError(null);
    adminRepository.getUnitsUsersUnitDetail(unitId).then((detail) => {
      if (!detail) return;
      setSelectedUnit(detail);
      setUnitDraft(cloneUnitDetail(detail));
      setUnitDetailBaseline(cloneUnitDetail(detail));
    });
  };

  const closeUnitDetail = () => {
    setSelectedUnit(null);
    setUnitDraft(null);
    setUnitDetailBaseline(null);
  };

  const handleUnitAddSection = (section: ResidentDetailSection) => {
    setUnitDraft((draft) => {
      if (!draft) return draft;
      return updatePrimaryUnitProfileSection(draft, section) ?? draft;
    });
  };

  const handleSaveUnitDetail = async () => {
    if (!unitDraft) return;
    setSaving(true);
    setActionError(null);
    try {
      await adminRepository.updateUnitsUsersUnitDetail(unitDraft.id, {
        parkingSpots: unitDraft.parkingSpots ?? [],
        lockers: unitDraft.lockers ?? [],
        bikeSpaces: unitDraft.bikeSpaces ?? [],
        primaryOccupancyId: unitDraft.primaryOccupancyId,
        profileDetails: unitDraft.profileDetails,
      });
      const refreshed = await adminRepository.getUnitsUsersUnitDetail(unitDraft.id);
      if (refreshed) {
        setSelectedUnit(refreshed);
        setUnitDraft(cloneUnitDetail(refreshed));
        setUnitDetailBaseline(cloneUnitDetail(refreshed));
      }
      showToast({ message: "Unit changes saved successfully.", variant: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save unit changes.";
      setActionError(message);
      showToast({ message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const openUserDetail = (userId: string) => {
    setActionError(null);
    adminRepository.getUnitsUsersUserDetail(userId).then((detail) => {
      if (!detail) return;
      const cloned = cloneUserDetail(detail);
      setSelectedUser(detail);
      setUserDraft(cloned);
      setUserDetailBaseline(cloneUserDetail(detail));
    });
  };

  const closeUserDetail = () => {
    setSelectedUser(null);
    setUserDraft(null);
    setUserDetailBaseline(null);
  };

  useEffect(() => {
    if (selectedUser) setUserDetailTab("details");
  }, [selectedUser]);

  const updateUserDraft = (patch: Partial<UnitsUsersUserDetail>) => {
    setUserDraft((draft) => (draft ? { ...draft, ...patch } : draft));
  };

  const handleUserAddProfileSection = (section: ResidentDetailSection) => {
    setUserDraft((draft) => {
      if (!draft) return draft;
      return updateUserProfileSection(draft, section) ?? draft;
    });
  };

  const toggleUserPortalModule = (moduleId: string) => {
    setUserDraft((draft) => {
      if (!draft?.portalModules) return draft;
      return {
        ...draft,
        portalModules: draft.portalModules.map((module) => {
          if (module.moduleId !== moduleId) return module;
          if (module.buildingEnabled === false) return module;
          return { ...module, enabled: !module.enabled };
        }),
      };
    });
  };

  const setAllUserPortalModules = (enabled: boolean) => {
    setUserDraft((draft) => {
      if (!draft?.portalModules) return draft;
      return {
        ...draft,
        portalModules: draft.portalModules.map((module) => ({
          ...module,
          enabled: module.buildingEnabled === false ? false : enabled,
        })),
      };
    });
  };

  const resetUserPortalModulesToTypeDefaults = async () => {
    if (!userDraft) return;
    const modules = await adminRepository.getResidentTypePortalModules(userDraft.type);
    updateUserDraft({ portalModules: modules });
  };

  const toggleUserBuildingAdminModule = (moduleKey: string) => {
    setUserDraft((draft) => {
      if (!draft?.buildingAdminModules) return draft;
      return {
        ...draft,
        buildingAdminModules: draft.buildingAdminModules.map((module) =>
          module.moduleKey === moduleKey ? { ...module, enabled: !module.enabled } : module
        ),
      };
    });
  };

  const setAllUserBuildingAdminModules = (enabled: boolean) => {
    setUserDraft((draft) => {
      if (!draft?.buildingAdminModules) return draft;
      return {
        ...draft,
        buildingAdminModules: draft.buildingAdminModules.map((module) => ({ ...module, enabled })),
      };
    });
  };

  const resetUserBuildingAdminModulesToRoleDefaults = async () => {
    if (!userDraft) return;
    const modules = await adminRepository.getBuildingAdminModulesForRole(
      userDraft.buildingAdminRoleLabel ?? "Resident"
    );
    updateUserDraft({ buildingAdminModules: modules });
  };

  const reloadUserBuildingAdminModules = async (occupancyId: string, roleLabel: string) => {
    const modules = await adminRepository.getOccupancyBuildingAdminModules(occupancyId, roleLabel);
    updateUserDraft({ buildingAdminModules: modules });
  };

  const handleResidentTypeChange = (nextType: UnitsUsersResidentType) => {
    if (!userDraft) return;
    void adminRepository.getOccupancyPortalModules(userDraft.id, nextType).then((modules) => {
      updateUserDraft({ type: nextType, portalModules: modules });
    });
  };

  const handleSortChange = (key: string) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const openAssignUnit = async (occupancyId: string) => {
    setActionError(null);
    setAssignOccupancyId(occupancyId);
    setAssignUnitId("");
    try {
      const units = await adminRepository.listAssignableUnits();
      setAssignableUnits(units);
      setAssignUnitOpen(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to load units.");
    }
  };

  const handleAssignUnit = async () => {
    if (!assignOccupancyId || !assignUnitId) return;
    setSaving(true);
    setActionError(null);
    try {
      await adminRepository.assignUnitToOccupancy(assignOccupancyId, assignUnitId);
      setAssignUnitOpen(false);
      setActiveTab("current");
      reloadLists();
      showToast({ message: "Unit assigned successfully.", variant: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign unit.";
      setActionError(message);
      showToast({ message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setActionError(null);
    try {
      await adminRepository.archiveUnitOccupancy(selectedUser.id);
      closeUserDetail();
      reloadLists();
      showToast({ message: "User archived successfully.", variant: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to archive record.";
      setActionError(message);
      showToast({ message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`Delete record for ${selectedUser.name}? This cannot be undone.`)) return;
    setSaving(true);
    setActionError(null);
    try {
      await adminRepository.deleteUnitOccupancy(selectedUser.id);
      closeUserDetail();
      reloadLists();
      showToast({ message: "User deleted successfully.", variant: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete record.";
      setActionError(message);
      showToast({ message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUserDetail = async () => {
    if (!userDraft) return;
    if (!userDraft.email.trim()) {
      setActionError("Email is required.");
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      const includePortalAccess =
        userDetailTab === "permissions" ||
        userDraft.canAccessResidentPortal !== undefined ||
        userDraft.canAccessBuildingAdmin !== undefined;

      await adminRepository.updateUnitsUsersUserDetail(userDraft.id, {
        firstName: userDraft.firstName,
        lastName: userDraft.lastName,
        email: userDraft.email,
        timezone: userDraft.timezone,
        type: userDraft.type,
        buzzerCode: userDraft.buzzerCode ?? "",
        homePhone: userDraft.homePhone ?? "",
        mobilePhone: userDraft.mobilePhone ?? "",
        businessPhone: userDraft.businessPhone ?? "",
        profileDetails: userDraft.profileDetails,
        ...(includePortalAccess
          ? {
              canAccessResidentPortal: userDraft.canAccessResidentPortal ?? true,
              canAccessBuildingAdmin: userDraft.canAccessBuildingAdmin ?? false,
              buildingAdminRoleLabel: userDraft.buildingAdminRoleLabel ?? "Resident (Admin)",
            }
          : {}),
      });
      if (
        includePortalAccess &&
        userDraft.canAccessResidentPortal !== false &&
        userDraft.portalModules?.length
      ) {
        await adminRepository.saveOccupancyPortalModules(
          userDraft.id,
          userDraft.type,
          userDraft.portalModules
        );
      }
      if (
        includePortalAccess &&
        userDraft.canAccessBuildingAdmin === true &&
        userDraft.buildingAdminModules?.length
      ) {
        await adminRepository.saveOccupancyBuildingAdminModules(
          userDraft.id,
          userDraft.buildingAdminModules
        );
      }
      const refreshed = await adminRepository.getUnitsUsersUserDetail(userDraft.id);
      if (refreshed) {
        setSelectedUser(refreshed);
        const cloned = cloneUserDetail(refreshed);
        setUserDraft(cloned);
        setUserDetailBaseline(cloneUserDetail(refreshed));
      }
      reloadLists();
      showToast({ message: "Changes saved successfully.", variant: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save changes.";
      setActionError(message);
      showToast({ message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleEmailLoginDetails = async (email: string, status: UnitsUsersAccountStatus) => {
    if (status !== "Activated") {
      setActionError("This user does not have a login account yet.");
      return;
    }
    if (!window.confirm(`Send password reset email to ${email}?`)) return;
    setSaving(true);
    setActionError(null);
    try {
      await resetPasswordForEmail(email);
      window.alert(`Password reset email sent to ${email}.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to send password reset email.");
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreUser = async (occupancyId: string) => {
    setSaving(true);
    setActionError(null);
    try {
      await adminRepository.restoreUnitOccupancy(occupancyId);
      reloadLists();
      showToast({ message: "User restored successfully.", variant: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to restore record.";
      setActionError(message);
      showToast({ message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateResident = async () => {
    if (!newResidentFirstName.trim() || !newResidentLastName.trim() || !newResidentEmail.trim()) return;
    if (newResidentPassword.length < 8) {
      setActionError("Password must be at least 8 characters.");
      return;
    }
    if (newResidentPassword !== newResidentPasswordConfirm) {
      setActionError("Passwords do not match.");
      return;
    }

    const assignedUnit = newResidentUnit || undefined;
    setSaving(true);
    setActionError(null);
    try {
      await adminRepository.createUnitOccupancy({
        firstName: newResidentFirstName.trim(),
        lastName: newResidentLastName.trim(),
        email: newResidentEmail.trim(),
        type: newResidentType,
        unitId: assignedUnit,
        password: newResidentPassword,
      });
      setNewResidentUnit("");
      setNewResidentType("Owner");
      setNewResidentFirstName("");
      setNewResidentLastName("");
      setNewResidentEmail("");
      setNewResidentPassword("");
      setNewResidentPasswordConfirm("");
      setAddResidentOpen(false);
      setActiveTab("current");
      reloadLists();
      showToast({ message: "Resident created successfully.", variant: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create resident.";
      setActionError(message);
      showToast({ message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const currentColumns: AdminTableColumn<UnitsUsersCurrentRow>[] = [
    {
      key: "unit",
      header: "Unit",
      sortable: true,
      sortValue: (row) => row.unitLabel,
      className: "text-center",
      render: (row) => row.unitLabel,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (row) => row.status,
      className: "text-center",
      render: (row) => <StatusCell status={row.status} tags={row.statusTags} />,
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (row) => row.name,
      className: "text-center",
      render: (row) => row.name,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      sortValue: (row) => row.type,
      className: "text-center",
      render: (row) => row.type,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      sortValue: (row) => row.email,
      className: "text-center",
      render: (row) => emailCell(row.email),
    },
    {
      key: "actions",
      header: "",
      className: "text-center",
      render: (row) => (
        <OptionsDropdown
          options={[
            { label: "View Unit Info", onClick: () => openUnitDetail(row.unitId) },
            { label: "View User Details", onClick: () => openUserDetail(row.id) },
            { label: "Merge Account", disabled: true, onClick: () => undefined },
            {
              label: "Email Login Details",
              onClick: () => handleEmailLoginDetails(row.email, row.status),
            },
          ]}
        />
      ),
    },
  ];

  const pendingColumns: AdminTableColumn<UnitsUsersPendingRow>[] = [
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (row) => row.status,
      className: "text-center",
      render: (row) => <StatusCell status={row.status} tags={[]} />,
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (row) => row.name,
      className: "text-center",
      render: (row) => row.name,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      sortValue: (row) => row.type,
      className: "text-center",
      render: (row) => row.type,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      sortValue: (row) => row.email,
      className: "text-center",
      render: (row) => emailCell(row.email),
    },
    {
      key: "actions",
      header: "",
      className: "text-center",
      render: (row) => (
        <OptionsDropdown
          options={[
            { label: "Assign Unit", onClick: () => openAssignUnit(row.id) },
            { label: "View User Details", onClick: () => openUserDetail(row.id) },
            { label: "Merge Account", disabled: true, onClick: () => undefined },
          ]}
        />
      ),
    },
  ];

  const unoccupiedColumns: AdminTableColumn<UnitsUsersUnoccupiedRow>[] = [
    {
      key: "unit",
      header: "Unit",
      sortable: true,
      sortValue: (row) => row.unitLabel,
      className: "text-center",
      render: (row) => row.unitLabel,
    },
    {
      key: "owners",
      header: "Owners",
      sortable: true,
      sortValue: (row) => row.owners,
      className: "text-center",
      render: (row) => row.owners,
    },
    {
      key: "tenants",
      header: "Tenants",
      sortable: true,
      sortValue: (row) => row.tenants,
      className: "text-center",
      render: (row) => row.tenants,
    },
    {
      key: "occupants",
      header: "Occupants",
      sortable: true,
      sortValue: (row) => row.occupants,
      className: "text-center",
      render: (row) => row.occupants,
    },
    {
      key: "updated",
      header: "Updated",
      sortable: true,
      sortValue: (row) => row.updatedAt,
      className: "text-center",
      render: (row) => row.updatedAt,
    },
    {
      key: "actions",
      header: "",
      className: "text-center",
      render: (row) => (
        <OptionsDropdown
          options={[
            { label: "View Unit Info", onClick: () => openUnitDetail(row.unitId) },
            {
              label: "Add New Resident to Unit",
              onClick: () => {
                setNewResidentUnit(row.unitId);
                setAddResidentOpen(true);
              },
            },
          ]}
        />
      ),
    },
  ];

  const archivedColumns: AdminTableColumn<UnitsUsersArchivedRow>[] = [
    {
      key: "unit",
      header: "Unit",
      sortable: true,
      sortValue: (row) => row.unitLabel ?? "",
      className: "text-center",
      render: (row) => row.unitLabel ?? "—",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (row) => row.status,
      className: "text-center",
      render: (row) => <StatusCell status={row.status} tags={[]} />,
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (row) => row.name,
      className: "text-center",
      render: (row) => row.name,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      sortValue: (row) => row.type,
      className: "text-center",
      render: (row) => row.type,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      sortValue: (row) => row.email,
      className: "text-center",
      render: (row) => emailCell(row.email),
    },
    {
      key: "archivedAt",
      header: "Archived Date",
      sortable: true,
      sortValue: (row) => row.archivedAt,
      className: "text-center",
      render: (row) => row.archivedAt,
    },
    {
      key: "actions",
      header: "",
      className: "text-center",
      render: (row) => (
        <OptionsDropdown
          options={[
            { label: "View User Details", onClick: () => openUserDetail(row.id) },
            { label: "Restore Record", onClick: () => handleRestoreUser(row.id) },
          ]}
        />
      ),
    },
  ];

  const commonFilters = [];
  if (activeTab !== "unoccupied" && statusOptions.length > 0) {
    commonFilters.push({
      id: "status",
      label: "Status:",
      value: statusFilter,
      options: statusOptions,
      onChange: (value: string) => {
        setStatusFilter(value);
        setPage(1);
      },
    });
  }
  if (activeTab !== "unoccupied") {
    commonFilters.push({
      id: "type",
      label: "Type:",
      value: typeFilter,
      options: USER_TYPE_OPTIONS,
      onChange: (value: string) => {
        setTypeFilter(value);
        setPage(1);
      },
    });
  }

  return (
    <div>
      <div className="mb-4 rounded bg-[#3476ef] px-4 py-2 text-sm font-semibold text-white">Units & Users</div>

      <AdminTabs tabs={TABS} activeTab={activeTab} onChange={(tab) => setActiveTab(tab as UnitsUsersTab)} />

      {actionError ? (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</div>
      ) : null}

      <div className="mb-3 flex flex-wrap justify-between gap-2">
        <button
          type="button"
          className="rounded bg-[#79d0df] px-3 py-1 text-sm text-white"
          onClick={() => window.alert("Column preferences are mock-only in this phase.")}
        >
          Change Column Preferences:
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded bg-[#7D5DA7] px-3 py-1 text-sm text-white hover:bg-[#6d4d97]"
            onClick={() => setTypePortalModulesOpen(true)}
          >
            <FaEdit />
            Edit Resident Type Module Defaults
          </button>
          <button
            type="button"
            className="rounded bg-[#7D5DA7] px-3 py-1 text-sm text-white hover:bg-[#6d4d97]"
            onClick={() => setAddResidentOpen(true)}
          >
            Add a New Resident
          </button>
        </div>
      </div>

      {activeTab === "current" && (
        <AdminPanelTable
          title={`${formatCount(counts.owners, "Owner", "Owners")} - ${formatCount(counts.tenants, "Tenant", "Tenants")} - ${formatCount(counts.occupants, "Occupant", "Occupants")}`}
          headerColor="purple"
          data={filteredCurrentRows}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search"
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          page={page}
          onPageChange={setPage}
          pageSizeChoices={[10, 25, 50, -1]}
          filters={commonFilters}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          columns={currentColumns}
        />
      )}

      {activeTab === "pending" && (
        <AdminPanelTable
          title="Users Pending Unit Assignment"
          headerColor="red"
          data={filteredPendingRows}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search"
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          page={page}
          onPageChange={setPage}
          pageSizeChoices={[10, 25, 50, -1]}
          filters={commonFilters}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          columns={pendingColumns}
        />
      )}

      {activeTab === "unoccupied" && (
        <AdminPanelTable
          title="Unoccupied Units"
          headerColor="orange"
          data={unoccupiedRows}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search"
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          page={page}
          onPageChange={setPage}
          pageSizeChoices={[10, 25, 50, -1]}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          columns={unoccupiedColumns}
        />
      )}

      {activeTab === "archived" && (
        <AdminPanelTable
          title={`${archivedRows.length} Archived User(s)`}
          headerColor="purple"
          data={filteredArchivedRows}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search"
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          page={page}
          onPageChange={setPage}
          pageSizeChoices={[5, 10, 25, 50, -1]}
          filters={commonFilters}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          columns={archivedColumns}
        />
      )}

      <Modal
        open={!!selectedUnit}
        onClose={closeUnitDetail}
        title={selectedUnit ? `Unit Info: ${selectedUnit.unitLabel}` : "Unit Info"}
        icon={<FaBuilding className="text-[#3476ef]" />}
        size="xl"
        footer={
          <div className="mx-auto flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
              onClick={closeUnitDetail}
            >
              Close
            </button>
            <button
              type="button"
              className="rounded bg-[#7D5DA7] px-4 py-2 text-sm text-white hover:bg-[#6d4d97] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleSaveUnitDetail}
              disabled={saving || !unitDraft || !isUnitDetailDirty}
            >
              Save Changes
            </button>
            <button
              type="button"
              className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white hover:bg-[#2968d8]"
              onClick={() => window.print()}
            >
              Print
            </button>
          </div>
        }
      >
        {selectedUnit && unitDraft ? (
          <div className="space-y-4 text-sm">
            <div className="rounded border border-slate-300 bg-white">
              <div className="border-b border-slate-200 bg-slate-100 px-3 py-2">
                <h4 className="font-semibold text-slate-700">Unit Information</h4>
              </div>
              <div className="grid gap-3 p-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <UnitSummaryLink
                    badgeClass="bg-[#f0ad4e]"
                    count={selectedUnit.serviceRequestsSubmitted}
                    label="Service Request(s) Submitted"
                    clickable
                  />
                  <hr className="border-slate-200" />
                  <UnitSummaryLink
                    badgeClass="bg-[#337ab7]"
                    count={selectedUnit.deliveriesPendingPickup}
                    label="Deliveries Pending Pickup for this Unit"
                  />
                  <hr className="border-slate-200" />
                  <UnitSummaryLink
                    badgeClass="bg-[#5cb85c]"
                    count={selectedUnit.visitorsToUnit}
                    label="Visitors to this Unit"
                  />
                </div>
                <div className="space-y-2">
                  <UnitSummaryLink
                    badgeClass="bg-[#d9534f]"
                    count={selectedUnit.incidentReportsByUsers}
                    label="Incident Report(s) Submitted By Users In This Unit"
                    clickable
                  />
                  <hr className="border-slate-200" />
                  <UnitSummaryLink
                    badgeClass="bg-[#d9534f]"
                    count={selectedUnit.incidentReportsInvolvingUnit}
                    label="Incident Report(s) Submitted Involving This Unit"
                    clickable
                  />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded border border-slate-300 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-3 py-2">
                <h4 className="font-semibold text-slate-700">Occupants in this Unit</h4>
                <button
                  type="button"
                  onClick={() => window.alert("Add occupant is mock-only in this phase.")}
                  className="rounded bg-[#7D5DA7] px-2 py-1 text-xs text-white hover:bg-[#6d4d97]"
                >
                  Add
                </button>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-white text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUnit.occupants.map((occupant) => (
                    <tr key={occupant.userId} className="border-b border-slate-100">
                      <td className="px-3 py-2">{occupant.type}</td>
                      <td className="px-3 py-2">{occupant.name}</td>
                      <td className="px-3 py-2">{occupant.email}</td>
                      <td className="px-3 py-2">
                        <StatusCell status={occupant.status} tags={occupant.statusTags} />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => openUserDetail(occupant.userId)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded border border-slate-300 bg-white">
              <div className="border-b border-slate-200 bg-slate-100 px-3 py-2">
                <h4 className="font-semibold text-slate-700">Homeowners Insurance</h4>
              </div>
              <div className="grid gap-3 p-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs uppercase text-slate-500">Insurance Carrier</span>
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-2"
                    value={selectedUnit.insuranceCarrier ?? ""}
                    readOnly
                    placeholder="Not provided"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase text-slate-500">Policy Number</span>
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-2"
                    value={selectedUnit.insurancePolicyNumber ?? ""}
                    readOnly
                    placeholder="Not provided"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-3">
                <UnitSectionPanel
                  title="Parking Spots"
                  emptyMessage="No parking spots listed."
                  items={unitDraft.parkingSpots}
                  onAdd={() => handleUnitAddSection("parkingSpots")}
                />
                <UnitSectionPanel
                  title="Lockers"
                  emptyMessage="No Lockers listed."
                  items={unitDraft.lockers}
                  onAdd={() => handleUnitAddSection("lockers")}
                />
                <UnitSectionPanel
                  title="Key Fobs"
                  emptyMessage="No key fobs listed."
                  items={unitDraft.keyFobs}
                  onAdd={() => handleUnitAddSection("keyFobs")}
                />
                <UnitSectionPanel
                  title="Vehicles"
                  emptyMessage="No vehicles listed."
                  items={unitDraft.vehicles}
                  onAdd={() => handleUnitAddSection("vehicles")}
                />
              </div>
              <div className="space-y-3">
                <UnitSectionPanel
                  title="Guest List"
                  emptyMessage="No Guests Listed."
                  items={unitDraft.guestList}
                  onAdd={() => handleUnitAddSection("guestList")}
                />
                <UnitSectionPanel
                  title="Bike Spaces"
                  emptyMessage="No Bike Spaces listed."
                  items={unitDraft.bikeSpaces}
                  onAdd={() => handleUnitAddSection("bikeSpaces")}
                />
                <UnitSectionPanel
                  title="Pets"
                  emptyMessage="No pets listed."
                  items={unitDraft.pets}
                  onAdd={() => handleUnitAddSection("pets")}
                />
                <UnitSectionPanel
                  title="Documents"
                  emptyMessage="No documents uploaded."
                  items={selectedUnit.documents}
                  readOnly
                />
                <UnitSectionPanel
                  title="Purchase Date & Maint. Fees"
                  emptyMessage="No Info Entered."
                  items={unitDraft.purchaseDateMaintFees ? [unitDraft.purchaseDateMaintFees] : []}
                  actionLabel="Edit"
                  onAdd={() => handleUnitAddSection("purchaseDateMaintFees")}
                />
              </div>
            </div>

            <UnitSectionPanel
              title="Notes"
              emptyMessage="No notes."
              items={selectedUnit.notes}
              readOnly
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!selectedUser}
        onClose={closeUserDetail}
        title={selectedUser ? selectedUser.name : "User Details"}
        icon={<FaUser className="text-[#3476ef]" />}
        size="xl"
        footer={
          <div className="flex w-full flex-wrap items-center justify-center gap-2">
            {userDetailTab === "details" ? (
              <>
                <button
                  type="button"
                  className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                  onClick={handleArchiveUser}
                  disabled={saving}
                >
                  Archive Record
                </button>
                <button
                  type="button"
                  className="rounded bg-[#d9534f] px-3 py-2 text-sm text-white hover:bg-[#c9302c] disabled:opacity-50"
                  onClick={handleDeleteUser}
                  disabled={saving}
                >
                  Delete Record
                </button>
                <button
                  type="button"
                  className="rounded bg-[#b94545] px-3 py-2 text-sm text-white opacity-50"
                  disabled
                  title="Merge account is not available in this release"
                >
                  Merge Account
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="rounded bg-[#3476ef] px-3 py-2 text-sm text-white"
              onClick={() => window.print()}
            >
              Print
            </button>
            {userDetailTab === "details" || userDetailTab === "extended" || userDetailTab === "permissions" ? (
              <button
                type="button"
                className="rounded bg-[#7D5DA7] px-3 py-2 text-sm text-white hover:bg-[#6d4d97] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSaveUserDetail}
                disabled={saving || !userDraft || !isUserDetailDirty}
              >
                Save Changes
              </button>
            ) : null}
            <button
              type="button"
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              onClick={closeUserDetail}
            >
              Cancel
            </button>
          </div>
        }
      >
        {selectedUser && userDraft ? (
          <div className="space-y-4 text-sm">
            <div className="text-xs text-slate-500">Last Login: {selectedUser.lastLogin ?? "Never"}</div>

            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              {USER_DETAIL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`rounded px-3 py-1.5 text-xs font-medium ${
                    userDetailTab === tab.id
                      ? "bg-[#2e3f4f] text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => setUserDetailTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {userDetailTab === "details" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3 rounded border border-slate-300 bg-white p-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-semibold text-slate-700">User Information</h4>
                    <StatusCell status={selectedUser.status} tags={selectedUser.statusTags} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">First Name</span>
                      <input
                        value={userDraft.firstName}
                        onChange={(event) => updateUserDraft({ firstName: event.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-2"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">Last Name</span>
                      <input
                        value={userDraft.lastName}
                        onChange={(event) => updateUserDraft({ lastName: event.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-2"
                      />
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs uppercase text-slate-500">Email</span>
                      <input
                        value={userDraft.email}
                        onChange={(event) => updateUserDraft({ email: event.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-2"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">Time Zone</span>
                      <input
                        value={userDraft.timezone}
                        onChange={(event) => updateUserDraft({ timezone: event.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-2"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">Buzzer Code</span>
                      <input
                        value={userDraft.buzzerCode ?? ""}
                        placeholder="Not provided"
                        onChange={(event) => updateUserDraft({ buzzerCode: event.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-2"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">Home Phone</span>
                      <input
                        value={userDraft.homePhone ?? ""}
                        placeholder="Not provided"
                        onChange={(event) => updateUserDraft({ homePhone: event.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-2"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">Mobile Phone</span>
                      <input
                        value={userDraft.mobilePhone ?? ""}
                        placeholder="Not provided"
                        onChange={(event) => updateUserDraft({ mobilePhone: event.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-2"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">Business Phone</span>
                      <input
                        value={userDraft.businessPhone ?? ""}
                        placeholder="Not provided"
                        onChange={(event) => updateUserDraft({ businessPhone: event.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-2"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">Other</span>
                      <input
                        value={userDraft.otherPhone ?? ""}
                        placeholder="Not provided"
                        readOnly
                        className="w-full rounded border border-slate-300 px-2 py-2 bg-slate-50"
                      />
                    </label>
                  </div>
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <p className="text-xs text-slate-600">
                      Resident portal module access is managed on the{" "}
                      <button
                        type="button"
                        className="text-[#3476ef] hover:underline"
                        onClick={() => setUserDetailTab("permissions")}
                      >
                        Permissions
                      </button>{" "}
                      tab.
                    </p>
                    <LegacyToggleRow label="Allow Classifieds Posting" enabled={selectedUser.allowClassifiedsPosting} />
                    <LegacyToggleRow label="Allow Amenity Booking" enabled={selectedUser.allowAmenityBooking} />
                    {selectedUser.allowAmenityBooking ? (
                      <textarea
                        value={selectedUser.allowAmenityBookingNotes ?? ""}
                        readOnly
                        rows={2}
                        placeholder="No amenity booking message set."
                        className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
                      />
                    ) : null}
                    <LegacyToggleRow
                      label="Allow Visitor Parking Permits"
                      enabled={selectedUser.allowVisitorParkingPermits}
                    />
                    {selectedUser.allowVisitorParkingPermits ? (
                      <textarea
                        value={selectedUser.allowVisitorParkingPermitsNotes ?? ""}
                        readOnly
                        rows={2}
                        placeholder="No visitor parking message set."
                        className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
                      />
                    ) : null}
                    <LegacyToggleRow label="Special Needs" enabled={selectedUser.specialNeeds} />
                    {selectedUser.specialNeeds ? (
                      <textarea
                        value={selectedUser.specialNeedsNotes ?? ""}
                        readOnly
                        rows={2}
                        placeholder="No special needs notes."
                        className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
                      />
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded border border-slate-300 bg-white p-3 text-center">
                    <h4 className="mb-2 font-semibold text-slate-700">Unit</h4>
                    <p className="text-base font-semibold">{selectedUser.unitLabel ?? "Pending assignment"}</p>
                    <button
                      type="button"
                      onClick={() => openAssignUnit(selectedUser.id)}
                      className="mt-2 rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      Edit Unit Assignment
                    </button>
                  </div>
                  <div className="rounded border border-slate-300 bg-white p-3">
                    <h4 className="mb-3 font-semibold text-slate-700">Role, Type & Home Address</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs uppercase text-slate-500">Role</p>
                        <p>{selectedUser.role ?? "Resident"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-500">Type</p>
                        <select
                          value={userDraft.type}
                          onChange={(event) =>
                            handleResidentTypeChange(event.target.value as UnitsUsersResidentType)
                          }
                          className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
                        >
                          {RESIDENT_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {userDraft.type === "Tenant" ? (
                        <div>
                          <p className="text-xs uppercase text-slate-500">Lease</p>
                          <p>
                            {selectedUser.leaseStartDate ?? "Not set"} - {selectedUser.leaseEndDate ?? "Not set"}
                          </p>
                        </div>
                      ) : null}
                      <div className="border-t border-slate-200 pt-2">
                        <p className="text-xs uppercase text-slate-500">Home Address</p>
                        <p>{selectedUser.homeAddressStreet ?? "—"}</p>
                        <p>{selectedUser.homeAddressCity ?? "—"}</p>
                        <p>{selectedUser.homeAddressProvince ?? "—"}</p>
                        <p>{selectedUser.homeAddressPostal ?? "—"}</p>
                        <p>{selectedUser.homeAddressCountry ?? "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {userDetailTab === "extended" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="rounded border border-slate-300 bg-white">
                    <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 font-semibold text-slate-700">
                      Reports
                    </div>
                    <div className="space-y-2 p-3">
                      <UnitSummaryLink
                        badgeClass="bg-[#f0ad4e]"
                        count={selectedUser.serviceRequestsSubmitted ?? 0}
                        label="Service Requests Submitted"
                        clickable
                      />
                      <hr className="border-slate-200" />
                      <UnitSummaryLink
                        badgeClass="bg-[#d9534f]"
                        count={selectedUser.incidentReportsSubmitted ?? 0}
                        label="Incident Report(s) Submitted"
                        clickable
                      />
                    </div>
                  </div>
                  <UnitSectionPanel
                    title="Parking Spots"
                    emptyMessage="No parking spots listed."
                    items={userDraft.parkingSpots ?? []}
                    onAdd={() => handleUserAddProfileSection("parkingSpots")}
                  />
                  <UnitSectionPanel
                    title="Lockers"
                    emptyMessage="No Lockers listed."
                    items={userDraft.lockers ?? []}
                    onAdd={() => handleUserAddProfileSection("lockers")}
                  />
                  <UnitSectionPanel
                    title="Key Fobs"
                    emptyMessage="No key fobs listed."
                    items={userDraft.keyFobs ?? []}
                    onAdd={() => handleUserAddProfileSection("keyFobs")}
                  />
                  <UnitSectionPanel
                    title="Vehicles"
                    emptyMessage="No vehicles listed."
                    items={userDraft.vehicles ?? []}
                    onAdd={() => handleUserAddProfileSection("vehicles")}
                  />
                </div>
                <div className="space-y-3">
                  <UnitSectionPanel
                    title="Guest List"
                    emptyMessage="No Guests Listed."
                    items={userDraft.guestList ?? []}
                    onAdd={() => handleUserAddProfileSection("guestList")}
                  />
                  <UnitSectionPanel
                    title="Emergency Contacts"
                    emptyMessage="No emergency contacts listed."
                    items={selectedUser.emergencyContacts ?? []}
                    readOnly
                  />
                  <UnitSectionPanel
                    title="Bike Spaces"
                    emptyMessage="No Bike Spaces listed."
                    items={userDraft.bikeSpaces ?? []}
                    onAdd={() => handleUserAddProfileSection("bikeSpaces")}
                  />
                  <UnitSectionPanel
                    title="Pets"
                    emptyMessage="No pets listed."
                    items={userDraft.pets ?? []}
                    onAdd={() => handleUserAddProfileSection("pets")}
                  />
                  <UnitSectionPanel
                    title="Documents"
                    emptyMessage="No documents uploaded."
                    items={selectedUser.documents ?? []}
                    readOnly
                  />
                  <UnitSectionPanel
                    title="Purchase Date & Maint. Fees"
                    emptyMessage="No Info Entered."
                    items={userDraft.purchaseDateMaintFees ? [userDraft.purchaseDateMaintFees] : []}
                    actionLabel="Edit"
                    onAdd={() => handleUserAddProfileSection("purchaseDateMaintFees")}
                  />
                </div>
              </div>
            ) : null}

            {userDetailTab === "permissions" ? (
              <div className="space-y-3">
                <div className="rounded border border-slate-300 bg-white">
                  <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 font-semibold text-slate-700">
                    Portal Access
                  </div>
                  <div className="space-y-3 p-3">
                    <p className="text-xs text-slate-600">
                      Control which portals this user can log into. These settings are independent — a user may have
                      access to one or both portals.
                    </p>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={userDraft.canAccessResidentPortal ?? true}
                        onChange={(event) =>
                          updateUserDraft({ canAccessResidentPortal: event.target.checked })
                        }
                        className="h-4 w-4"
                      />
                      Can access Resident portal
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={userDraft.canAccessBuildingAdmin ?? false}
                        onChange={(event) => {
                          const enabled = event.target.checked;
                          updateUserDraft({ canAccessBuildingAdmin: enabled });
                          if (enabled && userDraft) {
                            void reloadUserBuildingAdminModules(
                              userDraft.id,
                              userDraft.buildingAdminRoleLabel ?? "Resident (Admin)"
                            );
                          }
                        }}
                        className="h-4 w-4"
                      />
                      Can access Building Admin portal
                    </label>
                    {userDraft.canAccessBuildingAdmin ? (
                      <label className="block space-y-1 text-sm text-slate-700">
                        <span className="text-xs uppercase text-slate-500">Building Admin Role</span>
                        <select
                          value={userDraft.buildingAdminRoleLabel ?? "Resident (Admin)"}
                          onChange={(event) => {
                            const roleLabel = event.target.value;
                            updateUserDraft({ buildingAdminRoleLabel: roleLabel });
                            void reloadUserBuildingAdminModules(userDraft.id, roleLabel);
                          }}
                          className="w-full max-w-md rounded border border-slate-300 px-2 py-2"
                        >
                          {BUILDING_ADMIN_ROLES.map((role) => (
                            <option key={role.value} value={role.label}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>
                </div>

                <div className="rounded border border-slate-300 bg-white">
                  <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 font-semibold text-slate-700">
                    Resident Portal Modules
                  </div>
                  <div className="space-y-3 p-3">
                    {userDraft.canAccessResidentPortal === false ? (
                      <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        Resident portal access is disabled for this user. Enable it above to configure visible modules.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-slate-600">
                          Defaults based on {userDraft.type}. Uncheck modules this user should not see in the resident
                          portal.
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs">
                          <button
                            type="button"
                            onClick={resetUserPortalModulesToTypeDefaults}
                            className="text-[#3476ef] hover:underline"
                          >
                            Reset to type defaults
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllUserPortalModules(true)}
                            className="text-[#3476ef] hover:underline"
                          >
                            Select all
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllUserPortalModules(false)}
                            className="text-[#3476ef] hover:underline"
                          >
                            Select none
                          </button>
                        </div>
                        <div className="max-h-[420px] overflow-auto rounded border border-slate-200">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-slate-100 text-slate-600">
                              <tr>
                                <th className="px-3 py-2 text-left">Module</th>
                                <th className="px-3 py-2 text-center">Visible in Portal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(userDraft.portalModules ?? []).map((module) => (
                                <tr key={module.moduleId} className="border-t border-slate-100">
                                  <td className="px-3 py-2">
                                    <div className="font-medium text-slate-700">{module.name}</div>
                                    <div className="text-slate-500">{module.tileLabel}</div>
                                    {module.buildingEnabled === false ? (
                                      <div className="mt-1 text-[11px] text-slate-400">
                                        Disabled for this building in Portal Settings
                                      </div>
                                    ) : null}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={module.enabled}
                                      disabled={module.buildingEnabled === false}
                                      onChange={() => toggleUserPortalModule(module.moduleId)}
                                      className="h-4 w-4 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                  </td>
                                </tr>
                              ))}
                              {(userDraft.portalModules ?? []).length === 0 ? (
                                <tr>
                                  <td colSpan={2} className="px-3 py-6 text-center text-slate-500">
                                    No portal modules configured for this building.
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded border border-slate-300 bg-white">
                  <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 font-semibold text-slate-700">
                    Building Admin Modules
                  </div>
                  <div className="space-y-3 p-3">
                    {userDraft.canAccessBuildingAdmin !== true ? (
                      <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        Building admin access is disabled for this user. Enable it above to configure sidebar
                        modules.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-slate-600">
                          Defaults based on {userDraft.buildingAdminRoleLabel ?? "Resident"}. Uncheck modules this
                          user should not see in the building admin sidebar.
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs">
                          <button
                            type="button"
                            onClick={resetUserBuildingAdminModulesToRoleDefaults}
                            className="text-[#3476ef] hover:underline"
                          >
                            Reset to role defaults
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllUserBuildingAdminModules(true)}
                            className="text-[#3476ef] hover:underline"
                          >
                            Select all
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllUserBuildingAdminModules(false)}
                            className="text-[#3476ef] hover:underline"
                          >
                            Select none
                          </button>
                        </div>
                        <div className="max-h-[420px] overflow-auto rounded border border-slate-200">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-slate-100 text-slate-600">
                              <tr>
                                <th className="px-3 py-2 text-left">Module</th>
                                <th className="px-3 py-2 text-center">Visible in Sidebar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(userDraft.buildingAdminModules ?? []).map((module) => (
                                <tr key={module.moduleKey} className="border-t border-slate-100">
                                  <td className="px-3 py-2 font-medium text-slate-700">{module.label}</td>
                                  <td className="px-3 py-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={module.enabled}
                                      onChange={() => toggleUserBuildingAdminModule(module.moduleKey)}
                                      className="h-4 w-4"
                                    />
                                  </td>
                                </tr>
                              ))}
                              {(userDraft.buildingAdminModules ?? []).length === 0 ? (
                                <tr>
                                  <td colSpan={2} className="px-3 py-6 text-center text-slate-500">
                                    No building admin modules configured.
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {userDetailTab === "notes" ? (
              <UnitSectionPanel
                title="Notes"
                emptyMessage="No notes."
                items={selectedUser.notes ?? []}
                readOnly
              />
            ) : null}

            {userDetailTab === "external" ? (
              <div className="rounded border border-slate-300 bg-white">
                <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 font-semibold text-slate-700">
                  QuickBooks Online Linked Account
                </div>
                <div className="overflow-x-auto p-3">
                  <table className="w-full min-w-[520px] border border-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="border border-slate-200 px-2 py-2">Linked</th>
                        <th className="border border-slate-200 px-2 py-2">QuickBooks Name</th>
                        <th className="border border-slate-200 px-2 py-2">QuickBooks Email</th>
                        <th className="border border-slate-200 px-2 py-2">QuickBooks Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedUser.quickBooksLinkedAccounts ?? []).map((account) => (
                        <tr key={account.id} className={account.selected ? "bg-green-50" : "bg-white"}>
                          <td className="border border-slate-200 px-2 py-2 text-center">
                            <input type="checkbox" checked={!!account.selected} readOnly />
                          </td>
                          <td className="border border-slate-200 px-2 py-2">{account.name}</td>
                          <td className="border border-slate-200 px-2 py-2">{account.email}</td>
                          <td className="border border-slate-200 px-2 py-2">{account.address}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {userDetailTab === "account" ? (
              <div className="space-y-3 rounded border border-slate-300 bg-white p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <h4 className="text-base font-semibold text-slate-800">{selectedUser.accountBalance?.companyName ?? "Company"}</h4>
                    <p className="text-sm text-slate-600">{selectedUser.accountBalance?.companyAddress ?? "No company address."}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <h4 className="text-xl font-bold text-slate-800">Account Balance</h4>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded border border-slate-300 bg-slate-50 p-3">
                    <p className="text-xs uppercase text-slate-500">Unit #</p>
                    <p className="font-semibold">{selectedUser.unitLabel ?? "Pending assignment"}</p>
                  </div>
                  <div className="rounded border border-slate-300 bg-slate-50 p-3">
                    <p className="text-xs uppercase text-slate-500">Report Date</p>
                    <p className="font-semibold">{selectedUser.accountBalance?.reportDate ?? "—"}</p>
                  </div>
                </div>
                <div className="rounded border border-slate-300 p-3">
                  <h5 className="mb-2 font-semibold text-slate-700">Building / Property</h5>
                  <p>{selectedUser.accountBalance?.buildingName ?? "—"}</p>
                  <p>{selectedUser.accountBalance?.unitAddress ?? "—"}</p>
                </div>
                <div className="overflow-x-auto rounded border border-slate-300">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="border border-slate-200 px-2 py-2 text-left">Date</th>
                        <th className="border border-slate-200 px-2 py-2 text-left">Type</th>
                        <th className="border border-slate-200 px-2 py-2 text-left">Date Due</th>
                        <th className="border border-slate-200 px-2 py-2 text-left">Amount</th>
                        <th className="border border-slate-200 px-2 py-2 text-left">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedUser.accountBalance?.transactions ?? []).length === 0 ? (
                        <tr>
                          <td className="px-2 py-8 text-center text-slate-500" colSpan={5}>
                            No transactions available.
                          </td>
                        </tr>
                      ) : (
                        (selectedUser.accountBalance?.transactions ?? []).map((txn) => (
                          <tr key={txn.id}>
                            <td className="border border-slate-200 px-2 py-2">{txn.date}</td>
                            <td className="border border-slate-200 px-2 py-2">{txn.type}</td>
                            <td className="border border-slate-200 px-2 py-2">{txn.dueDate}</td>
                            <td className="border border-slate-200 px-2 py-2">{txn.amount}</td>
                            <td className="border border-slate-200 px-2 py-2">{txn.remainingBalance}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-2 sm:grid-cols-6">
                  <div className="rounded border border-slate-200 p-2 text-center">
                    <p className="text-xs text-slate-500">Current</p>
                    <p className="font-semibold">{selectedUser.accountBalance?.aging.current ?? "$0.00"}</p>
                  </div>
                  <div className="rounded border border-slate-200 p-2 text-center">
                    <p className="text-xs text-slate-500">1-30 Days</p>
                    <p className="font-semibold">{selectedUser.accountBalance?.aging.days1To30 ?? "$0.00"}</p>
                  </div>
                  <div className="rounded border border-slate-200 p-2 text-center">
                    <p className="text-xs text-slate-500">31-60 Days</p>
                    <p className="font-semibold">{selectedUser.accountBalance?.aging.days31To60 ?? "$0.00"}</p>
                  </div>
                  <div className="rounded border border-slate-200 p-2 text-center">
                    <p className="text-xs text-slate-500">61-90 Days</p>
                    <p className="font-semibold">{selectedUser.accountBalance?.aging.days61To90 ?? "$0.00"}</p>
                  </div>
                  <div className="rounded border border-slate-200 p-2 text-center">
                    <p className="text-xs text-slate-500">Over 90 Days</p>
                    <p className="font-semibold">{selectedUser.accountBalance?.aging.over90 ?? "$0.00"}</p>
                  </div>
                  <div className="rounded border border-slate-200 bg-slate-50 p-2 text-center">
                    <p className="text-xs text-slate-500">Amount Due</p>
                    <p className="font-semibold">{selectedUser.accountBalance?.aging.amountDue ?? "$0.00"}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={addResidentOpen}
        onClose={() => setAddResidentOpen(false)}
        title="Add a New User"
        icon={<FaCheck className="text-[#3476ef]" />}
        size="lg"
        footer={
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
              onClick={() => setAddResidentOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-[#3476ef] px-3 py-2 text-sm text-white"
              onClick={handleCreateResident}
            >
              Continue
            </button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-700">
            <span>Unit (optional)</span>
            <select
              value={newResidentUnit}
              onChange={(event) => setNewResidentUnit(event.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-2"
            >
              <option value="">Pending assignment</option>
              {unitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span>Select Type</span>
            <select
              value={newResidentType}
              onChange={(event) => setNewResidentType(event.target.value as UnitsUsersResidentType)}
              className="w-full rounded border border-slate-300 px-2 py-2"
            >
              {USER_TYPE_OPTIONS.filter((option) => option.value).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span>First Name</span>
            <input
              value={newResidentFirstName}
              onChange={(event) => setNewResidentFirstName(event.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-2"
            />
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span>Last Name</span>
            <input
              value={newResidentLastName}
              onChange={(event) => setNewResidentLastName(event.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-2"
            />
          </label>

          <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
            <span>Email</span>
            <input
              value={newResidentEmail}
              onChange={(event) => setNewResidentEmail(event.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-2"
              type="email"
            />
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span>Password</span>
            <input
              value={newResidentPassword}
              onChange={(event) => setNewResidentPassword(event.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-2"
              type="password"
              autoComplete="new-password"
            />
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span>Confirm Password</span>
            <input
              value={newResidentPasswordConfirm}
              onChange={(event) => setNewResidentPasswordConfirm(event.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-2"
              type="password"
              autoComplete="new-password"
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={assignUnitOpen}
        onClose={() => setAssignUnitOpen(false)}
        title="Assign Unit"
        icon={<FaBuilding className="text-[#3476ef]" />}
        size="md"
        footer={
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
              onClick={() => setAssignUnitOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-[#3476ef] px-3 py-2 text-sm text-white disabled:opacity-50"
              onClick={handleAssignUnit}
              disabled={!assignUnitId || saving}
            >
              Assign Unit
            </button>
          </div>
        }
      >
        <label className="block space-y-1 text-sm text-slate-700">
          <span>Select unoccupied unit</span>
          <select
            value={assignUnitId}
            onChange={(event) => setAssignUnitId(event.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-2"
          >
            <option value="">Choose a unit…</option>
            {assignableUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.label}
              </option>
            ))}
          </select>
        </label>
        {assignableUnits.length === 0 ? (
          <p className="mt-2 text-sm text-amber-700">No unoccupied units available. Add units in Building Definition first.</p>
        ) : null}
      </Modal>

      <ResidentTypePortalModulesModal
        open={typePortalModulesOpen}
        onClose={() => setTypePortalModulesOpen(false)}
        onSaved={() => {
          if (selectedUser && userDraft) {
            adminRepository.getOccupancyPortalModules(userDraft.id, userDraft.type).then((modules) => {
              updateUserDraft({ portalModules: modules });
            });
          }
        }}
      />
    </div>
  );
}
