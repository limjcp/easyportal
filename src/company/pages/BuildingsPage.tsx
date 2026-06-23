import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminPanelTable, AdminTabs, type SortDirection } from "../../admin/components/AdminPanelTable";
import { ConfirmModal } from "../../shared/ConfirmModal";
import { CrudPanel } from "../../shared/CrudPanel";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { useTabChangeWithBusy } from "../../shared/useTabChangeWithBusy";
import { companyRepository } from "../data/companyRepository";
import { getBuildingColumns } from "../config/buildingColumns";
import { AddBuildingModal } from "../modals/AddBuildingModal";
import type { CompanyBuilding } from "../../resident/data/types";

type BuildingsTab = "current" | "archived";

type BuildingsPageProps = {
  onOpenBuilding: (building: CompanyBuilding) => void;
  onRefreshBuildings?: () => Promise<CompanyBuilding[]>;
  activeBuildingId?: string | null;
  onBuildingArchived?: (buildingId: string) => void;
  onBuildingCreated?: () => void;
};

export function BuildingsPage({
  onOpenBuilding,
  onRefreshBuildings,
  activeBuildingId,
  onBuildingArchived,
  onBuildingCreated,
}: BuildingsPageProps) {
  const [tab, setTab] = useState<BuildingsTab>("current");
  const [buildings, setBuildings] = useState<CompanyBuilding[]>([]);
  const [archivedBuildings, setArchivedBuildings] = useState<CompanyBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("condo");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [addOpen, setAddOpen] = useState(false);
  const [copyFrom, setCopyFrom] = useState<CompanyBuilding | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CompanyBuilding | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<CompanyBuilding | null>(null);
  const pendingArchiveIdRef = useRef<string | null>(null);
  const pendingRestoreIdRef = useRef<string | null>(null);

  const loadBuildings = useCallback(() => {
    companyRepository.getBuildings().then(setBuildings);
  }, []);

  const loadArchivedBuildings = useCallback(() => {
    companyRepository.getArchivedBuildings().then(setArchivedBuildings);
  }, []);

  const refreshLists = useCallback(async () => {
    if (onRefreshBuildings) {
      await onRefreshBuildings();
    }
    loadBuildings();
    loadArchivedBuildings();
  }, [loadBuildings, loadArchivedBuildings, onRefreshBuildings]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      companyRepository.getBuildings().then((data) => {
        if (!cancelled) setBuildings(data);
      }),
      companyRepository.getArchivedBuildings().then((data) => {
        if (!cancelled) setArchivedBuildings(data);
      }),
    ]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadBuildings, loadArchivedBuildings]);

  const openCopyProperty = useCallback((building: CompanyBuilding) => {
    setCopyFrom(building);
    setAddOpen(true);
  }, []);

  const requestArchive = useCallback((building: CompanyBuilding) => {
    setArchiveTarget(building);
  }, []);

  const requestRestore = useCallback((building: CompanyBuilding) => {
    setRestoreTarget(building);
  }, []);

  const activeColumns = useMemo(
    () =>
      getBuildingColumns({
        mode: "active",
        onView: onOpenBuilding,
        onCopy: openCopyProperty,
        onArchive: requestArchive,
      }),
    [onOpenBuilding, openCopyProperty, requestArchive]
  );

  const archivedColumns = useMemo(
    () =>
      getBuildingColumns({
        mode: "archived",
        onView: onOpenBuilding,
        onRestore: requestRestore,
      }),
    [onOpenBuilding, requestRestore]
  );

  const { run: archiveBuilding, loading: archiving } = useAsyncAction(
    useCallback(async () => {
      const id = pendingArchiveIdRef.current;
      if (!id) return;
      await companyRepository.archiveBuilding(id);
      await refreshLists();
      if (activeBuildingId === id) {
        onBuildingArchived?.(id);
      }
      setArchiveTarget(null);
      pendingArchiveIdRef.current = null;
    }, [activeBuildingId, onBuildingArchived, refreshLists]),
    { successMessage: "Building archived." }
  );

  const { run: restoreBuilding, loading: restoring } = useAsyncAction(
    useCallback(async () => {
      const id = pendingRestoreIdRef.current;
      if (!id) return;
      await companyRepository.restoreBuilding(id);
      await refreshLists();
      setRestoreTarget(null);
      pendingRestoreIdRef.current = null;
      setTab("current");
    }, [refreshLists]),
    { successMessage: "Building restored." }
  );

  const handleCreated = async (building: CompanyBuilding) => {
    await refreshLists();
    onBuildingCreated?.();
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

  const handleTabChange = useTabChangeWithBusy((next: string) => {
    setTab(next as BuildingsTab);
    setPage(1);
    setSearch("");
  });

  const tableData = tab === "current" ? buildings : archivedBuildings;
  const tableColumns = tab === "current" ? activeColumns : archivedColumns;

  return (
    <CrudPanel className="space-y-3" loading={loading}>
      <AdminTabs
        tabs={[
          { id: "current", label: "Current Buildings" },
          { id: "archived", label: "Archived Buildings" },
        ]}
        activeTab={tab}
        onChange={handleTabChange}
      />

      {tab === "current" && (
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
      )}

      <AddBuildingModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setCopyFrom(null);
        }}
        onCreated={handleCreated}
        copyFrom={copyFrom}
      />

      <ConfirmModal
        open={archiveTarget !== null}
        onClose={() => {
          if (archiving) return;
          setArchiveTarget(null);
          pendingArchiveIdRef.current = null;
        }}
        title="Archive Building"
        message={
          "Are you sure you want to archive this condo and all of the MVP Condo Property Management admins associated with it?\n\n(This will only remove your company from administering this condo; the condo itself is not archived.)"
        }
        variant="danger"
        loading={archiving}
        onConfirm={() => {
          if (!archiveTarget) return;
          pendingArchiveIdRef.current = archiveTarget.id;
          void archiveBuilding();
        }}
      />

      <ConfirmModal
        open={restoreTarget !== null}
        onClose={() => {
          if (restoring) return;
          setRestoreTarget(null);
          pendingRestoreIdRef.current = null;
        }}
        title="Restore Building"
        message="Restore this condo to active administration?"
        loading={restoring}
        onConfirm={() => {
          if (!restoreTarget) return;
          pendingRestoreIdRef.current = restoreTarget.id;
          void restoreBuilding();
        }}
      />

      <AdminPanelTable
        title={tab === "current" ? "Buildings" : "Archived Buildings"}
        headerColor="brand"
        data={tableData}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="search"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        pageSizeChoices={[5, 10, 25, 50, -1]}
        page={page}
        onPageChange={setPage}
        columns={tableColumns}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        getRowKey={(b) => b.id}
      />
    </CrudPanel>
  );
}
