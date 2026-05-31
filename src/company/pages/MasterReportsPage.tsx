import { useEffect, useState } from "react";
import {
  FaBuilding,
  FaCheck,
  FaDownload,
  FaEye,
  FaSave,
  FaThLarge,
  FaUsers,
} from "react-icons/fa";
import { AdminFormPanel } from "../../admin/components/AdminFormPanel";
import { PortalTileArrangeEditor } from "../../admin/components/PortalTileArrangeEditor";
import { AdminPanelTable } from "../../admin/components/AdminPanelTable";
import { MasterReportHubPanel } from "../components/MasterReportHubPanel";
import { companyRepository } from "../data/companyRepository";
import type { CompanyRoute } from "../navigation";
import type { BuildingTotalRow, CompanyMasterReportStats } from "../../resident/data/types";
import type { CustomPortalTile, PortalModuleConfig } from "../../resident/data/types";
import { applyArrangeTiles, toArrangeTiles } from "../../resident/data/portalTileLayout";

type MasterReportsPageProps = {
  onNavigate: (route: CompanyRoute) => void;
};

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
  const [masterModules, setMasterModules] = useState<PortalModuleConfig[]>([]);
  const [masterCustomTiles, setMasterCustomTiles] = useState<CustomPortalTile[]>([]);
  const [masterPrimaryTileLimit, setMasterPrimaryTileLimit] = useState(8);
  const [savingMaster, setSavingMaster] = useState(false);
  const [masterSaved, setMasterSaved] = useState(false);

  useEffect(() => {
    companyRepository.getMasterReportStats().then(setStats);
    companyRepository.getBuildingTotals().then(setBuildingTotals);
    companyRepository.getMasterPortalModules().then(setMasterModules);
    companyRepository.getMasterCustomPortalTiles().then(setMasterCustomTiles);
    companyRepository.getMasterPrimaryTileLimit().then(setMasterPrimaryTileLimit);
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

  const arrangeTiles = toArrangeTiles(masterModules, masterCustomTiles, masterPrimaryTileLimit);
  const updateArrangement = (nextTiles: ReturnType<typeof toArrangeTiles>) => {
    const next = applyArrangeTiles(nextTiles, masterModules, masterCustomTiles, masterPrimaryTileLimit);
    setMasterModules(next.modules);
    setMasterCustomTiles(next.customTiles);
    setMasterSaved(false);
  };

  const handleSaveMaster = async () => {
    setSavingMaster(true);
    await companyRepository.updateMasterPortalLayout({
      modules: masterModules,
      customTiles: masterCustomTiles,
      primaryTileLimit: masterPrimaryTileLimit,
    });
    setSavingMaster(false);
    setMasterSaved(true);
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

      <AdminFormPanel title="Master Arrange Resident Tiles" icon={<FaThLarge className="text-slate-500" />} headerColor="primary">
        <p className="mb-3 text-sm text-slate-600">
          This arrangement is the master default used by Building Admin when they enable master layout. Click
          <strong> Edit Arrangement</strong>, then drag tiles by the handle to reorder. Overflow from the first two rows
          is pushed into compact tiles.
        </p>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="font-medium text-slate-700">Primary Tile Capacity</span>
            <input
              type="number"
              min={1}
              max={20}
              value={masterPrimaryTileLimit}
              onChange={(e) => {
                setMasterPrimaryTileLimit(Math.max(1, Math.min(20, Number(e.target.value) || 1)));
                setMasterSaved(false);
              }}
              className="mt-1 block w-40 rounded border border-slate-300 px-3 py-1.5"
            />
          </label>
          <button
            type="button"
            onClick={handleSaveMaster}
            disabled={savingMaster}
            className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-3 py-2 text-sm font-semibold text-white hover:bg-[#2c67d1] disabled:opacity-60"
          >
            <FaSave />
            {savingMaster ? "Saving..." : "Save Master Arrangement"}
          </button>
          {masterSaved && (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
              <FaCheck />
              Saved
            </span>
          )}
        </div>
        <PortalTileArrangeEditor
          tiles={arrangeTiles}
          primaryTileLimit={masterPrimaryTileLimit}
          onChange={updateArrangement}
        />
      </AdminFormPanel>

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
                onClick={() => alert("Export tools — coming soon.")}
              >
                <FaDownload className="text-slate-500" />
                Tools
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => alert("Toggle columns — coming soon.")}
              >
                <FaEye className="text-slate-500" />
                Toggle Columns
              </button>
            </div>
          }
          columns={[
            {
              key: "subscription",
              header: "Subscription",
              className: "text-center",
              render: (r) => r.subscription || "",
              sortValue: (r) => r.subscription,
            },
            {
              key: "corp",
              header: "Corp",
              render: (r) => r.corp,
              sortValue: (r) => r.corp,
            },
            {
              key: "name",
              header: "Name",
              render: (r) => r.name,
              sortValue: (r) => r.name,
            },
            {
              key: "address",
              header: "Address",
              render: (r) => r.address,
              sortValue: (r) => r.address,
            },
            {
              key: "owners",
              header: "Owners",
              className: "text-center",
              render: (r) => r.owners,
              sortValue: (r) => r.owners,
            },
            {
              key: "activatedUsers",
              header: "Activated Users",
              className: "text-center",
              render: (r) => r.activatedUsers,
              sortValue: (r) => r.activatedUsers,
            },
          ]}
        />
      </div>
    </div>
  );
}
