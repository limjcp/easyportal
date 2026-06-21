import { useEffect, useMemo, useState } from "react";
import {
  FaBuilding,
  FaDownload,
  FaEye,
  FaThLarge,
  FaUsers,
} from "react-icons/fa";
import { AdminPanelTable } from "../../admin/components/AdminPanelTable";
import { MasterReportHubPanel } from "../components/MasterReportHubPanel";
import { companyRepository } from "../data/companyRepository";
import { ColumnPrefsModal } from "../../shared/ColumnPrefsModal";
import { downloadCsv } from "../../shared/exportCsv";
import {
  filterColumnsByKey,
  loadVisibleColumnKeys,
  saveVisibleColumnKeys,
} from "../../shared/tableColumnPrefs";
import type { CompanyRoute } from "../navigation";
import type { BuildingTotalRow, CompanyMasterReportStats } from "../../resident/data/types";

type MasterReportsPageProps = {
  onNavigate: (route: CompanyRoute) => void;
};

const COMMUNITY_TOTALS_COLUMN_PREFS_KEY = "company-community-totals-columns";
const COMMUNITY_TOTALS_COLUMNS = [
  { key: "subscription", label: "Subscription" },
  { key: "corp", label: "Corp" },
  { key: "name", label: "Name" },
  { key: "address", label: "Address" },
  { key: "owners", label: "Owners" },
  { key: "activatedUsers", label: "Activated Users" },
];

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof FaBuilding;
  value: number;
  label: string;
}) {
  return (
    <div className="flex overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
      <div className="flex w-1/4 items-center justify-center bg-[#3476ef] py-6 text-white">
        <Icon className="text-2xl" />
      </div>
      <div className="flex w-3/4 flex-col items-center justify-center py-4">
        <h4 className="text-2xl font-semibold text-slate-800">{value.toLocaleString()}</h4>
        <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export function MasterReportsPage({ onNavigate }: MasterReportsPageProps) {
  const [stats, setStats] = useState<CompanyMasterReportStats | null>(null);
  const [buildingTotals, setBuildingTotals] = useState<BuildingTotalRow[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("address");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [columnPrefsOpen, setColumnPrefsOpen] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<Set<string>>(() =>
    loadVisibleColumnKeys(
      COMMUNITY_TOTALS_COLUMN_PREFS_KEY,
      COMMUNITY_TOTALS_COLUMNS.map((column) => column.key)
    )
  );

  const communityTotalsColumns = useMemo(
    () => [
      {
        key: "subscription",
        header: "Subscription",
        className: "text-center",
        render: (r: BuildingTotalRow) => r.subscription || "",
        sortValue: (r: BuildingTotalRow) => r.subscription,
      },
      {
        key: "corp",
        header: "Corp",
        render: (r: BuildingTotalRow) => r.corp,
        sortValue: (r: BuildingTotalRow) => r.corp,
      },
      {
        key: "name",
        header: "Name",
        render: (r: BuildingTotalRow) => r.name,
        sortValue: (r: BuildingTotalRow) => r.name,
      },
      {
        key: "address",
        header: "Address",
        render: (r: BuildingTotalRow) => r.address,
        sortValue: (r: BuildingTotalRow) => r.address,
      },
      {
        key: "owners",
        header: "Owners",
        className: "text-center",
        render: (r: BuildingTotalRow) => r.owners,
        sortValue: (r: BuildingTotalRow) => r.owners,
      },
      {
        key: "activatedUsers",
        header: "Activated Users",
        className: "text-center",
        render: (r: BuildingTotalRow) => r.activatedUsers,
        sortValue: (r: BuildingTotalRow) => r.activatedUsers,
      },
    ],
    []
  );

  const visibleCommunityTotalsColumns = useMemo(
    () => filterColumnsByKey(communityTotalsColumns, visibleColumnKeys),
    [communityTotalsColumns, visibleColumnKeys]
  );

  useEffect(() => {
    companyRepository.getMasterReportStats().then(setStats);
    companyRepository.getBuildingTotals().then(setBuildingTotals);
  }, []);

  const handleSortChange = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "address" ? "desc" : "asc");
    }
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <MasterReportHubPanel onNavigate={onNavigate} />

      {stats && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={FaBuilding} value={stats.communities} label="Communities" />
          <StatCard icon={FaThLarge} value={stats.owners} label="Owners" />
          <StatCard icon={FaUsers} value={stats.activatedUsers} label="Activated Users" />
        </div>
      )}

      <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
        <div className="bg-[#7b4bb7] px-4 py-2">
          <h3 className="text-sm font-semibold text-white">Community Totals</h3>
        </div>
        <AdminPanelTable
          title=""
          showHeader={false}
          data={buildingTotals}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="search by: Community ID, Name, Address"
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          page={page}
          onPageChange={setPage}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          getRowKey={(row) => row.id}
          toolbarExtra={
            <div className="flex flex-wrap gap-2 lg:ml-auto">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() =>
                  downloadCsv(
                    "community-totals.csv",
                    ["Subscription", "Corp", "Name", "Address", "Owners", "Activated Users"],
                    buildingTotals.map((row) => [
                      row.subscription || "",
                      row.corp,
                      row.name,
                      row.address,
                      String(row.owners),
                      String(row.activatedUsers),
                    ])
                  )
                }
              >
                <FaDownload className="text-slate-500" />
                Tools
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setColumnPrefsOpen(true)}
              >
                <FaEye className="text-slate-500" />
                Toggle Columns
              </button>
            </div>
          }
          columns={visibleCommunityTotalsColumns}
        />
      </div>

      <ColumnPrefsModal
        open={columnPrefsOpen}
        onClose={() => setColumnPrefsOpen(false)}
        title="Toggle Columns"
        columns={COMMUNITY_TOTALS_COLUMNS}
        visibleKeys={visibleColumnKeys}
        onSave={(keys) => {
          saveVisibleColumnKeys(COMMUNITY_TOTALS_COLUMN_PREFS_KEY, keys);
          setVisibleColumnKeys(new Set(keys));
        }}
      />
    </div>
  );
}
