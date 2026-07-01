import { useCallback, useEffect, useState } from "react";
import { FaEdit, FaEnvelope, FaPlus } from "react-icons/fa";
import { StatusBadge } from "../components/AdminBadges";
import { AdminPanelTable } from "../components/AdminPanelTable";
import { AdminPageActions } from "../components/AdminPageActions";
import { adminRepository } from "../data/adminRepository";
import { AddBuildingAdminModal } from "../modals/AddBuildingAdminModal";
import { BuildingPermissionDefaultsModal } from "../modals/BuildingPermissionDefaultsModal";
import { EditBuildingAdminModal } from "../modals/EditBuildingAdminModal";
import type { AdminRoute } from "../navigation";
import { useAsyncAction } from "../../shared/useAsyncAction";
import type { BuildingAdmin } from "../../resident/data/types";

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "View All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

type AdminsPageProps = {
  route: AdminRoute & { page: "admins" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

export function AdminsPage({ route, onNavigate, refreshKey, onRefresh }: AdminsPageProps) {
  const [admins, setAdmins] = useState<BuildingAdmin[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [addOpen, setAddOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => adminRepository.getBuildingAdmins().then(setAdmins);

  useEffect(() => {
    load();
    setPage(1);
  }, [refreshKey]);

  const filtered = admins.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    return true;
  });

  const handleSortChange = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const { run: handleEmailLogin } = useAsyncAction(
    useCallback(async (admin: BuildingAdmin) => {
      await adminRepository.emailBuildingAdminLoginDetails(admin.id);
      return admin;
    }, []),
    {
      successMessage: (admin) =>
        admin ? `Login details emailed to ${admin.email || admin.name}.` : "Login details emailed.",
    }
  );

  return (
    <>
      <AdminPageActions route={route} onNavigate={onNavigate} />

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setPermissionsOpen(true)}
          className="inline-flex items-center gap-2 rounded bg-[#7D5DA7] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#6d4d97]"
        >
          <FaEdit />
          Edit Permission Defaults
        </button>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded bg-[#7D5DA7] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#6d4d97]"
        >
          <FaPlus />
          Add a New Admin
        </button>
      </div>

      <AdminPanelTable
        title="Building Administrators"
        headerColor="purple"
        data={filtered}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="search by: unit, name, email"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        page={page}
        onPageChange={setPage}
        pageSizeChoices={[10, 25, 50, 100]}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        filters={[
          {
            id: "status",
            label: "Status:",
            value: statusFilter,
            options: STATUS_FILTER_OPTIONS,
            onChange: (v) => {
              setStatusFilter(v);
              setPage(1);
            },
          },
        ]}
        columns={[
          {
            key: "status",
            header: "Status",
            sortable: true,
            sortValue: (r) => r.status,
            className: "text-center",
            render: (r) => (
              <StatusBadge status={r.status === "active" ? "Active" : "inactive"} />
            ),
          },
          {
            key: "name",
            header: "Name",
            sortable: true,
            sortValue: (r) => r.name,
            render: (r) => <span className="text-left">{r.name}</span>,
          },
          {
            key: "email",
            header: "Email",
            sortable: true,
            sortValue: (r) => r.email,
            className: "text-center",
            render: (r) =>
              r.email ? (
                <a href={`mailto:${r.email}`} className="text-[#3476ef] underline">
                  {r.email}
                </a>
              ) : (
                "—"
              ),
          },
          {
            key: "role",
            header: "Type",
            sortable: true,
            sortValue: (r) => r.role,
            className: "text-center",
            render: (r) => r.role,
          },
          {
            key: "lastLogin",
            header: "Last Login",
            sortable: true,
            sortValue: (r) => r.lastLogin,
            className: "text-center",
            render: (r) => r.lastLogin || "—",
          },
          {
            key: "actions",
            header: "",
            className: "text-center",
            render: (r) => (
              <div className="inline-flex items-stretch">
                <button
                  type="button"
                  onClick={() => setEditId(r.id)}
                  className="inline-flex items-center gap-1 rounded-l border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <FaEdit className="text-slate-400" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleEmailLogin(r)}
                  title="Email Login Details"
                  className="inline-flex items-center rounded-r border border-l-0 border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <FaEnvelope />
                </button>
              </div>
            ),
          },
        ]}
      />

      <AddBuildingAdminModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          load();
          onRefresh();
        }}
      />

      <BuildingPermissionDefaultsModal
        open={permissionsOpen}
        onClose={() => setPermissionsOpen(false)}
        onSaved={onRefresh}
      />

      <EditBuildingAdminModal
        open={!!editId}
        adminId={editId}
        onClose={() => setEditId(null)}
        onSaved={() => {
          load();
          onRefresh();
        }}
      />
    </>
  );
}
