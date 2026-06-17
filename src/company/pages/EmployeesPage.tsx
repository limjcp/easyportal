import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEnvelope, FaInfoCircle, FaUserCircle } from "react-icons/fa";
import { AdminPanelTable } from "../../admin/components/AdminPanelTable";
import type { SortDirection } from "../../admin/components/AdminPanelTable";
import { RowActionsMenu } from "../../shared/RowActionsMenu";
import { Tooltip } from "../../shared/Tooltip";
import { companyRepository } from "../data/companyRepository";
import { AddEmployeeModal } from "../modals/AddEmployeeModal";
import { EditEmployeeModal } from "../modals/EditEmployeeModal";
import { PermissionDefaultsModal } from "../modals/PermissionDefaultsModal";
import { RoleNamesModal } from "../modals/RoleNamesModal";
import type { CompanyBuilding, CompanyEmployee } from "../../resident/data/types";

function formatLastLogin(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
}

function exportEmployeesCsv(employees: CompanyEmployee[], buildings: CompanyBuilding[]) {
  const buildingName = (id: string) => {
    const b = buildings.find((x) => x.id === id);
    return b ? `(${b.code}) ${b.name}` : id;
  };
  const headers = ["Name", "Role", "Email", "Condos", "Last Login"];
  const rows = employees.map((e) => [
    `${e.firstName} ${e.lastName}`,
    e.role,
    e.email,
    e.assignedBuildingIds.map(buildingName).join("; "),
    e.lastLogin ?? "",
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "employees.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function EmployeesPage() {
  const [employees, setEmployees] = useState<CompanyEmployee[]>([]);
  const [buildings, setBuildings] = useState<CompanyBuilding[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [roleNamesOpen, setRoleNamesOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<CompanyEmployee | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    void companyRepository
      .getEmployees()
      .then(setEmployees)
      .catch((err) => {
        setEmployees([]);
        setLoadError(err instanceof Error ? err.message : "Failed to load employees.");
      });
    void companyRepository.getBuildings().then(setBuildings).catch(() => setBuildings([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const buildingById = useMemo(() => {
    const map = new Map<string, CompanyBuilding>();
    buildings.forEach((b) => map.set(b.id, b));
    return map;
  }, [buildings]);

  const buildingLabel = (ids: string[]) => {
    const names = ids
      .map((id) => buildingById.get(id))
      .filter(Boolean)
      .map((b) => `(${b!.code}) ${b!.name}`);
    if (names.length === 0) return "—";
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
  };

  const buildingDetails = (ids: string[]) => {
    if (ids.length === 0) return <span className="text-slate-500">No buildings assigned</span>;
    return (
      <ul className="max-h-48 space-y-1 overflow-y-auto">
        {ids.map((id) => {
          const b = buildingById.get(id);
          if (!b) return null;
          return (
            <li key={id}>
              ({b.code}) {b.name} — {b.address}
            </li>
          );
        })}
      </ul>
    );
  };

  const handleSortChange = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleEdit = (employee: CompanyEmployee) => {
    setSelectedEmployee(employee);
    setEditOpen(true);
  };

  const handleEmailLoginDetails = async (employee: CompanyEmployee) => {
    const result = await companyRepository.emailEmployeeLoginDetails(employee.id);
    alert(result.message);
  };

  const filteredForExport = useMemo(() => {
    if (!search) return employees;
    const q = search.toLowerCase();
    return employees.filter((e) => JSON.stringify(e).toLowerCase().includes(q));
  }, [employees, search]);

  return (
    <div>
      {loadError && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRoleNamesOpen(true)}
          className="rounded bg-[#5c2d91] px-3 py-1.5 text-sm text-white hover:bg-[#4a2475]"
        >
          Edit User Type/Role Names
        </button>
        <button
          type="button"
          onClick={() => setPermissionsOpen(true)}
          className="rounded bg-[#5c2d91] px-3 py-1.5 text-sm text-white hover:bg-[#4a2475]"
        >
          Edit Permission Defaults
        </button>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="rounded bg-[#5c2d91] px-3 py-1.5 text-sm text-white hover:bg-[#4a2475]"
        >
          + Add a New Employee
        </button>
      </div>

      <AdminPanelTable
        title="Employees"
        headerColor="purple"
        data={employees}
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        page={page}
        onPageChange={setPage}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        getRowKey={(e) => e.id}
        toolbarExtra={
          <button
            type="button"
            onClick={() => exportEmployeesCsv(filteredForExport, buildings)}
            className="rounded border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
          >
            Export CSV
          </button>
        }
        columns={[
          {
            key: "name",
            header: "Name",
            sortable: true,
            sortValue: (e) => `${e.lastName} ${e.firstName}`.toLowerCase(),
            render: (e) => (
              <div className="flex items-center gap-2 font-semibold">
                <FaUserCircle className="shrink-0 text-2xl text-slate-300" />
                <span>
                  {e.firstName} {e.lastName}
                </span>
              </div>
            ),
          },
          {
            key: "role",
            header: "Role",
            sortable: true,
            sortValue: (e) => e.role,
            className: "text-center",
            render: (e) => <span className="block text-center">{e.role}</span>,
          },
          {
            key: "email",
            header: "Email",
            sortable: true,
            sortValue: (e) => e.email.toLowerCase(),
            render: (e) => (
              <a href={`mailto:${e.email}`} className="text-[#3476ef] hover:underline">
                {e.email}
              </a>
            ),
          },
          {
            key: "condos",
            header: "Condos",
            hideBelow: "lg",
            render: (e) => (
              <div className="flex items-start gap-1">
                <span className="min-w-0">{buildingLabel(e.assignedBuildingIds)}</span>
                {e.assignedBuildingIds.length > 0 ? (
                  <Tooltip content={buildingDetails(e.assignedBuildingIds)}>
                    <FaInfoCircle className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-600" />
                  </Tooltip>
                ) : null}
              </div>
            ),
          },
          {
            key: "lastLogin",
            header: "Last Login",
            sortable: true,
            sortValue: (e) => e.lastLogin ?? "",
            hideBelow: "md",
            className: "text-center",
            render: (e) => (
              <span className="block text-center">{formatLastLogin(e.lastLogin)}</span>
            ),
          },
          {
            key: "actions",
            header: "",
            render: (e) => (
              <RowActionsMenu
                actions={[
                  {
                    id: "edit",
                    label: "Edit",
                    onClick: () => handleEdit(e),
                  },
                  {
                    id: "email-login",
                    label: "Email Login Details",
                    icon: <FaEnvelope className="text-slate-500" />,
                    onClick: () => handleEmailLoginDetails(e),
                  },
                ]}
              />
            ),
          },
        ]}
      />

      <RoleNamesModal open={roleNamesOpen} onClose={() => setRoleNamesOpen(false)} onSaved={load} />
      <PermissionDefaultsModal
        open={permissionsOpen}
        onClose={() => setPermissionsOpen(false)}
        onSaved={load}
      />
      <AddEmployeeModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} />
      <EditEmployeeModal
        open={editOpen}
        employee={selectedEmployee}
        onClose={() => {
          setEditOpen(false);
          setSelectedEmployee(null);
        }}
        onSaved={load}
      />
    </div>
  );
}
