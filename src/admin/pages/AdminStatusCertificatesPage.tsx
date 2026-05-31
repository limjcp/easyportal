import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminPanelTable,
  AdminTabs,
  type SortDirection,
} from "../components/AdminPanelTable";
import { AdminPageActions } from "../components/AdminPageActions";
import { adminRepository } from "../data/adminRepository";
import { getCertificateColumns } from "../../company/config/certificateColumns";
import { CertificateViewModal } from "../../company/components/CertificateViewModal";
import { CertificateSettingsPanel } from "../../company/pages/CertificateSettingsPanel";
import type { AdminRoute } from "../navigation";
import type { CertificateDetail, MasterReportRow } from "../../resident/data/types";

type AdminStatusCertificatesPageProps = {
  route: AdminRoute & { page: "status-certificates" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
};

export function AdminStatusCertificatesPage({
  route,
  onNavigate,
  refreshKey,
}: AdminStatusCertificatesPageProps) {
  const tab = route.tab ?? "current";
  const isSettingsTab = tab === "settings";
  const archived = tab === "archived";

  const [rows, setRows] = useState<MasterReportRow[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [detailRow, setDetailRow] = useState<MasterReportRow | null>(null);
  const [certificateDetail, setCertificateDetail] = useState<CertificateDetail | null>(null);
  const [sortKey, setSortKey] = useState<string | undefined>(archived ? "requested" : "due");
  const [sortDir, setSortDir] = useState<SortDirection>(archived ? "desc" : "asc");

  useEffect(() => {
    setSortKey(archived ? "requested" : "due");
    setSortDir(archived ? "desc" : "asc");
    setPage(1);
  }, [tab]);

  useEffect(() => {
    if (isSettingsTab) {
      setRows([]);
      return;
    }
    adminRepository.getBuildingStatusCertificates(archived).then(setRows);
  }, [archived, isSettingsTab, refreshKey]);

  const openCertificateView = useCallback((row: MasterReportRow) => {
    setDetailRow(row);
    setCertificateDetail(null);
    if (row.unread) {
      adminRepository.markBuildingStatusCertificateRead(row.id);
    }
    adminRepository.getBuildingStatusCertificateDetail(row.id).then((d) => setCertificateDetail(d ?? null));
  }, []);

  const closeDetail = () => {
    setDetailRow(null);
    setCertificateDetail(null);
  };

  const columns = useMemo(
    () => getCertificateColumns(tab, openCertificateView, { singleBuilding: true }),
    [tab, openCertificateView]
  );

  const handleSortChange = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const panelTitle = isSettingsTab
    ? "Certificate Settings"
    : archived
      ? "Archived Certificate Requests"
      : "Certificate Requests";

  return (
    <>
      <AdminPageActions route={route} onNavigate={onNavigate} />

      <AdminTabs
        tabs={[
          { id: "current", label: "Certificate Requests" },
          { id: "archived", label: "Archived Certificate Requests" },
          { id: "settings", label: "Certificate Settings" },
        ]}
        activeTab={tab}
        onChange={(t) =>
          onNavigate({
            page: "status-certificates",
            tab: t as "current" | "archived" | "settings",
          })
        }
      />

      {isSettingsTab ? (
        <CertificateSettingsPanel />
      ) : (
        <AdminPanelTable
          title={panelTitle}
          headerColor="purple"
          data={rows}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="search"
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          page={page}
          onPageChange={setPage}
          columns={columns}
          emptyMessage="No data available in table."
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={handleSortChange}
        />
      )}

      <CertificateViewModal open={!!detailRow} detail={certificateDetail} onClose={closeDetail} />
    </>
  );
}
