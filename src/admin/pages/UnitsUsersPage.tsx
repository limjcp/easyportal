import { type ReactNode, useEffect, useMemo, useState } from "react";
import { FaBuilding, FaCheck, FaUser } from "react-icons/fa";
import { OptionsDropdown } from "../components/AdminBadges";
import { AdminPanelTable, AdminTabs, type AdminTableColumn } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { Modal } from "../../shared/Modal";
import type {
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

type UserDetailTab = "details" | "extended" | "notes" | "external" | "account";

const USER_DETAIL_TABS: { id: UserDetailTab; label: string }[] = [
  { id: "details", label: "User Details" },
  { id: "extended", label: "Extended Info" },
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
}: {
  title: string;
  actionLabel?: string;
  emptyMessage: string;
  items: string[];
}) {
  return (
    <div className="rounded border border-slate-300 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-3 py-2">
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        <button
          type="button"
          onClick={() => window.alert(`${actionLabel} is mock-only in this phase.`)}
          className="rounded bg-[#7D5DA7] px-2 py-1 text-xs text-white hover:bg-[#6d4d97]"
        >
          {actionLabel}
        </button>
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

export function UnitsUsersPage({ refreshKey }: UnitsUsersPageProps) {
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
  const [selectedUser, setSelectedUser] = useState<UnitsUsersUserDetail | null>(null);
  const [userDetailTab, setUserDetailTab] = useState<UserDetailTab>("details");
  const [addResidentOpen, setAddResidentOpen] = useState(false);

  const [newResidentUnit, setNewResidentUnit] = useState("");
  const [newResidentType, setNewResidentType] = useState<UnitsUsersResidentType>("Owner");
  const [newResidentFirstName, setNewResidentFirstName] = useState("");
  const [newResidentLastName, setNewResidentLastName] = useState("");
  const [newResidentEmail, setNewResidentEmail] = useState("");

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
    adminRepository.getUnitsUsersUnitDetail(unitId).then(setSelectedUnit);
  };

  const openUserDetail = (userId: string) => {
    adminRepository.getUnitsUsersUserDetail(userId).then(setSelectedUser);
  };

  useEffect(() => {
    if (selectedUser) setUserDetailTab("details");
  }, [selectedUser]);

  const handleSortChange = (key: string) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const handleCreateResident = () => {
    if (!newResidentFirstName.trim() || !newResidentLastName.trim() || !newResidentEmail.trim()) return;

    const newId = `uu-new-${Date.now()}`;
    const fullName = `${newResidentFirstName.trim()} ${newResidentLastName.trim()}`;

    if (newResidentUnit) {
      const selected = unitOptions.find((option) => option.value === newResidentUnit);
      if (!selected) return;
      setCurrentRows((rows) => [
        {
          id: newId,
          unitId: newResidentUnit,
          unitLabel: selected.label,
          status: "Awaiting Activation",
          statusTags: [],
          name: fullName,
          type: newResidentType,
          email: newResidentEmail.trim(),
          dateCreated: new Date().toISOString().slice(0, 10),
        },
        ...rows,
      ]);
      setUnoccupiedRows((rows) => rows.filter((row) => row.unitId !== newResidentUnit));
    } else {
      setPendingRows((rows) => [
        {
          id: newId,
          status: "Pending Unit Assignment",
          name: fullName,
          type: newResidentType,
          email: newResidentEmail.trim(),
        },
        ...rows,
      ]);
    }

    setNewResidentUnit("");
    setNewResidentType("Owner");
    setNewResidentFirstName("");
    setNewResidentLastName("");
    setNewResidentEmail("");
    setAddResidentOpen(false);
    setActiveTab(newResidentUnit ? "current" : "pending");
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
            { label: "Merge Account", onClick: () => window.alert("Merge Account is mock-only in this phase.") },
            {
              label: "Email Login Details",
              onClick: () => window.alert(`Mock email sent to ${row.email}`),
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
            { label: "Assign Unit", onClick: () => window.alert("Assign Unit is mock-only in this phase.") },
            { label: "View User Details", onClick: () => openUserDetail(row.id) },
            { label: "Merge Account", onClick: () => window.alert("Merge Account is mock-only in this phase.") },
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
            { label: "Restore Record", onClick: () => window.alert("Restore is mock-only in this phase.") },
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

      <div className="mb-3 flex flex-wrap justify-between gap-2">
        <button
          type="button"
          className="rounded bg-[#79d0df] px-3 py-1 text-sm text-white"
          onClick={() => window.alert("Column preferences are mock-only in this phase.")}
        >
          Change Column Preferences:
        </button>
        <button
          type="button"
          className="rounded bg-[#7D5DA7] px-3 py-1 text-sm text-white hover:bg-[#6d4d97]"
          onClick={() => setAddResidentOpen(true)}
        >
          Add a New Resident
        </button>
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
        onClose={() => setSelectedUnit(null)}
        title={selectedUnit ? `Unit Info: ${selectedUnit.unitLabel}` : "Unit Info"}
        icon={<FaBuilding className="text-[#3476ef]" />}
        size="xl"
        footer={
          <div className="mx-auto flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
              onClick={() => setSelectedUnit(null)}
            >
              Close
            </button>
            <button
              type="button"
              className="rounded bg-[#7D5DA7] px-4 py-2 text-sm text-white hover:bg-[#6d4d97]"
              onClick={() => window.alert("Save Changes is mock-only in this phase.")}
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
        {selectedUnit ? (
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
                <UnitSectionPanel title="Parking Spots" emptyMessage="No parking spots listed." items={selectedUnit.parkingSpots} />
                <UnitSectionPanel title="Lockers" emptyMessage="No Lockers listed." items={selectedUnit.lockers} />
                <UnitSectionPanel title="Key Fobs" emptyMessage="No key fobs listed." items={selectedUnit.keyFobs} />
                <UnitSectionPanel title="Vehicles" emptyMessage="No vehicles listed." items={selectedUnit.vehicles} />
              </div>
              <div className="space-y-3">
                <UnitSectionPanel title="Guest List" emptyMessage="No Guests Listed." items={selectedUnit.guestList} />
                <UnitSectionPanel title="Bike Spaces" emptyMessage="No Bike Spaces listed." items={selectedUnit.bikeSpaces} />
                <UnitSectionPanel title="Pets" emptyMessage="No pets listed." items={selectedUnit.pets} />
                <UnitSectionPanel title="Documents" emptyMessage="No documents uploaded." items={selectedUnit.documents} />
                <UnitSectionPanel
                  title="Purchase Date & Maint. Fees"
                  emptyMessage="No Info Entered."
                  items={selectedUnit.purchaseDateMaintFees ? [selectedUnit.purchaseDateMaintFees] : []}
                />
              </div>
            </div>

            <UnitSectionPanel title="Notes" emptyMessage="No notes." items={selectedUnit.notes} />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
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
                  onClick={() => window.alert("Archive Record is mock-only in this phase.")}
                >
                  Archive Record
                </button>
                <button
                  type="button"
                  className="rounded bg-[#d9534f] px-3 py-2 text-sm text-white"
                  onClick={() => window.alert("Delete Record is mock-only in this phase.")}
                >
                  Delete Record
                </button>
                <button
                  type="button"
                  className="rounded bg-[#b94545] px-3 py-2 text-sm text-white"
                  onClick={() => window.alert("Merge Account is mock-only in this phase.")}
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
            {userDetailTab === "details" || userDetailTab === "external" ? (
              <button
                type="button"
                className="rounded bg-[#7D5DA7] px-3 py-2 text-sm text-white"
                onClick={() => window.alert("Save Changes is mock-only in this phase.")}
              >
                Save Changes
              </button>
            ) : null}
            <button
              type="button"
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              onClick={() => setSelectedUser(null)}
            >
              Cancel
            </button>
          </div>
        }
      >
        {selectedUser ? (
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
                      <input value={selectedUser.firstName} readOnly className="w-full rounded border border-slate-300 px-2 py-2" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">Last Name</span>
                      <input value={selectedUser.lastName} readOnly className="w-full rounded border border-slate-300 px-2 py-2" />
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs uppercase text-slate-500">Email</span>
                      <input value={selectedUser.email} readOnly className="w-full rounded border border-slate-300 px-2 py-2" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">Time Zone</span>
                      <input value={selectedUser.timezone} readOnly className="w-full rounded border border-slate-300 px-2 py-2" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">Buzzer Code</span>
                      <input
                        value={selectedUser.buzzerCode ?? ""}
                        placeholder="Not provided"
                        readOnly
                        className="w-full rounded border border-slate-300 px-2 py-2"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">Home Phone</span>
                      <input
                        value={selectedUser.homePhone ?? ""}
                        placeholder="Not provided"
                        readOnly
                        className="w-full rounded border border-slate-300 px-2 py-2"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">Mobile Phone</span>
                      <input
                        value={selectedUser.mobilePhone ?? ""}
                        placeholder="Not provided"
                        readOnly
                        className="w-full rounded border border-slate-300 px-2 py-2"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">Business Phone</span>
                      <input
                        value={selectedUser.businessPhone ?? ""}
                        placeholder="Not provided"
                        readOnly
                        className="w-full rounded border border-slate-300 px-2 py-2"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase text-slate-500">Other</span>
                      <input
                        value={selectedUser.otherPhone ?? ""}
                        placeholder="Not provided"
                        readOnly
                        className="w-full rounded border border-slate-300 px-2 py-2"
                      />
                    </label>
                  </div>
                  <div className="space-y-2 border-t border-slate-200 pt-3">
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
                      onClick={() => window.alert("Edit Unit Assignment is mock-only in this phase.")}
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
                        <p>{selectedUser.type}</p>
                      </div>
                      {selectedUser.type === "Tenant" ? (
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
                    items={selectedUser.parkingSpots ?? []}
                  />
                  <UnitSectionPanel title="Lockers" emptyMessage="No Lockers listed." items={selectedUser.lockers ?? []} />
                  <UnitSectionPanel title="Key Fobs" emptyMessage="No key fobs listed." items={selectedUser.keyFobs ?? []} />
                  <UnitSectionPanel title="Vehicles" emptyMessage="No vehicles listed." items={selectedUser.vehicles ?? []} />
                </div>
                <div className="space-y-3">
                  <UnitSectionPanel title="Guest List" emptyMessage="No Guests Listed." items={selectedUser.guestList ?? []} />
                  <UnitSectionPanel
                    title="Emergency Contacts"
                    emptyMessage="No emergency contacts listed."
                    items={selectedUser.emergencyContacts ?? []}
                  />
                  <UnitSectionPanel
                    title="Bike Spaces"
                    emptyMessage="No Bike Spaces listed."
                    items={selectedUser.bikeSpaces ?? []}
                  />
                  <UnitSectionPanel title="Pets" emptyMessage="No pets listed." items={selectedUser.pets ?? []} />
                  <UnitSectionPanel title="Documents" emptyMessage="No documents uploaded." items={selectedUser.documents ?? []} />
                  <UnitSectionPanel
                    title="Purchase Date & Maint. Fees"
                    emptyMessage="No Info Entered."
                    items={selectedUser.purchaseDateMaintFees ? [selectedUser.purchaseDateMaintFees] : []}
                  />
                </div>
              </div>
            ) : null}

            {userDetailTab === "notes" ? (
              <UnitSectionPanel title="Notes" emptyMessage="No notes." items={selectedUser.notes ?? []} />
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
        </div>
      </Modal>
    </div>
  );
}
