import { useEffect, useState } from "react";
import { AdminPanelTable } from "../components/AdminPanelTable";
import { AdminMobileCard } from "../components/AdminMobileCard";
import { AdminPageActions } from "../components/AdminPageActions";
import { adminRepository } from "../data/adminRepository";
import { formatDisplayDate, isFireSafetyDue } from "../../resident/data/fireSafetyUtils";
import { FireSafetyDetailModal } from "../modals/FireSafetyDetailModal";
import type { AdminRoute } from "../navigation";
import type { FireSafetySubmission } from "../../resident/data/types";

type FireSafetySubmissionsPageProps = {
  route: AdminRoute & { page: "fire-safety" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
};

export function FireSafetySubmissionsPage({
  route,
  onNavigate,
  refreshKey,
}: FireSafetySubmissionsPageProps) {
  const [items, setItems] = useState<FireSafetySubmission[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [unitFilter, setUnitFilter] = useState("all");
  const [detailItem, setDetailItem] = useState<FireSafetySubmission | null>(null);

  useEffect(() => {
    adminRepository.getAllFireSafetySubmissions().then(setItems);
    setPage(1);
  }, [refreshKey]);

  const units = [...new Set(items.map((i) => i.unit))].sort();

  const filtered = items.filter((item) => {
    if (unitFilter !== "all" && item.unit !== unitFilter) return false;
    return true;
  });

  return (
    <>
      <AdminPageActions route={route} onNavigate={onNavigate} />

      <AdminPanelTable
        title="Fire Safety Plan — Resident Uploads"
        headerColor="orange"
        data={filtered}
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        page={page}
        onPageChange={setPage}
        filters={[
          {
            id: "unit",
            label: "Unit",
            value: unitFilter,
            onChange: setUnitFilter,
            options: [
              { value: "all", label: "All Units" },
              ...units.map((u) => ({ value: u, label: `Unit ${u}` })),
            ],
          },
        ]}
        columns={[
          { key: "uploadedAt", header: "Upload Date", render: (row) => formatDisplayDate(row.uploadedAt) },
          { key: "unit", header: "Unit", render: (row) => row.unit },
          {
            key: "status",
            header: "Annual Status",
            render: (row) => {
              const due = isFireSafetyDue(row.uploadedAt);
              return (
                <span
                  className={
                    due
                      ? "rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                      : "rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                  }
                >
                  {due ? "Due for renewal" : "Current"}
                </span>
              );
            },
          },
          {
            key: "notes",
            header: "Notes",
            render: (row) => (
              <span className="line-clamp-1 max-w-xs text-sm text-slate-600">{row.notes ?? "—"}</span>
            ),
          },
          {
            key: "action",
            header: "Action",
            render: (row) => (
              <button
                type="button"
                onClick={() => setDetailItem(row)}
                className="text-[#3476ef] hover:underline"
              >
                View Photo
              </button>
            ),
          },
        ]}
        mobileCard={(row) => {
          const due = isFireSafetyDue(row.uploadedAt);
          return (
            <AdminMobileCard
              title={`Unit ${row.unit}`}
              subtitle={formatDisplayDate(row.uploadedAt)}
              badges={
                <span
                  className={
                    due
                      ? "rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                      : "rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                  }
                >
                  {due ? "Due for renewal" : "Current"}
                </span>
              }
              fields={[{ label: "Notes", value: row.notes ?? "—" }]}
              actions={
                <button
                  type="button"
                  onClick={() => setDetailItem(row)}
                  className="w-full rounded bg-[#3476ef] px-3 py-2 text-sm font-medium text-white hover:bg-[#2d68cf]"
                >
                  View photo
                </button>
              }
              highlight={due}
            />
          );
        }}
      />

      <FireSafetyDetailModal
        open={!!detailItem}
        submission={detailItem}
        onClose={() => setDetailItem(null)}
      />
    </>
  );
}
