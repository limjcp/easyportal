import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPanelTable, type SortDirection } from "../../admin/components/AdminPanelTable";
import { companyRepository } from "../data/companyRepository";
import { getBuildingColumns } from "../config/buildingColumns";
import { AddBuildingModal } from "../modals/AddBuildingModal";
import type { CompanyBuilding } from "../../resident/data/types";

type BuildingsPageProps = {
  onOpenBuilding: (building: CompanyBuilding) => void;
};

export function BuildingsPage({ onOpenBuilding }: BuildingsPageProps) {
  const [buildings, setBuildings] = useState<CompanyBuilding[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("condo");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [addOpen, setAddOpen] = useState(false);
  const [copyFrom, setCopyFrom] = useState<CompanyBuilding | null>(null);

  const loadBuildings = useCallback(() => {
    companyRepository.getBuildings().then(setBuildings);
  }, []);

  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

  const openCopyProperty = useCallback((building: CompanyBuilding) => {
    setCopyFrom(building);
    setAddOpen(true);
  }, []);

  const columns = useMemo(
    () => getBuildingColumns(onOpenBuilding, openCopyProperty),
    [onOpenBuilding, openCopyProperty]
  );

  const handleCreated = (building: CompanyBuilding) => {
    loadBuildings();
    onOpenBuilding(building);
  };

  const handleSortChange = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "condo" ? "asc" : "asc");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setCopyFrom(null);
            setAddOpen(true);
          }}
          className="rounded bg-[#7D5DA7] px-3 py-1.5 text-sm text-white hover:bg-[#6b4f92]"
        >
          + Add a New Building
        </button>
      </div>

      <AddBuildingModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setCopyFrom(null);
        }}
        onCreated={handleCreated}
        copyFrom={copyFrom}
      />

      <AdminPanelTable
        title="Buildings"
        headerColor="purple"
        data={buildings}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="search"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        pageSizeChoices={[5, 10, 25, 50, -1]}
        page={page}
        onPageChange={setPage}
        columns={columns}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        getRowKey={(b) => b.id}
      />
    </div>
  );
}
