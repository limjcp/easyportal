import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AdminPanelTable,
  AdminTabs,
  type SortDirection,
} from "../../admin/components/AdminPanelTable";
import { MasterReportHubPanel } from "../components/MasterReportHubPanel";
import { companyRepository } from "../data/companyRepository";
import { getMasterReportTitle } from "../navigation";
import type { CompanyRoute } from "../navigation";
import type {
  BoardApprovalDetail,
  CertificateDetail,
  IncidentReportDetail,
  MasterReportRow,
  MasterReportTab,
  PortalSignupRequest,
  PurchaseOrder,
  PurchaseOrderPrefill,
} from "../../resident/data/types";
import { BoardApprovalViewModal } from "../components/BoardApprovalViewModal";
import { CertificateViewModal } from "../components/CertificateViewModal";
import { IncidentReportViewModal } from "../components/IncidentReportViewModal";
import { PortalSignupViewModal } from "../components/PortalSignupViewModal";
import { Modal } from "../../shared/Modal";
import { ConfirmModal } from "../../shared/ConfirmModal";
import { ColumnPrefsModal } from "../../shared/ColumnPrefsModal";
import { downloadCsv } from "../../shared/exportCsv";
import {
  filterColumnsByKey,
  loadVisibleColumnKeys,
  saveVisibleColumnKeys,
} from "../../shared/tableColumnPrefs";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { FaDownload } from "react-icons/fa";
import { getMasterReportColumns } from "../config/masterReportColumns";
import { getBoardApprovalColumns } from "../config/boardApprovalColumns";
import { getCertificateColumns } from "../config/certificateColumns";
import { getIncidentReportColumns } from "../config/incidentReportColumns";
import { getMasterReportFilters } from "../config/masterReportFilters";
import { CertificateSettingsPanel } from "./CertificateSettingsPanel";
import { ServiceRequestViewModal } from "../components/ServiceRequestViewModal";
import { PurchaseOrderFormModal } from "../modals/PurchaseOrderFormModal";

type MasterReportDetailPageProps = {
  route: CompanyRoute & { page: "master-report-detail" };
  onNavigate: (route: CompanyRoute) => void;
};

const INCIDENT_REPORT_COLUMN_PREFS_KEY = "company-master-report-incident-columns";
const INCIDENT_REPORT_COLUMN_OPTIONS = [
  { key: "id", label: "ID" },
  { key: "address", label: "Address" },
  { key: "incidentDate", label: "Incident Date" },
  { key: "unit", label: "Unit" },
  { key: "location", label: "Location" },
  { key: "status", label: "Status" },
  { key: "pendingReply", label: "Pending Reply" },
  { key: "resolutionTime", label: "Resolution Time" },
  { key: "severity", label: "Severity" },
  { key: "view", label: "View" },
];

export function MasterReportDetailPage({ route, onNavigate }: MasterReportDetailPageProps) {
  const [rows, setRows] = useState<MasterReportRow[]>([]);
  const [buildings, setBuildings] = useState<{ value: string; label: string }[]>([]);
  const [buildingId, setBuildingId] = useState("all");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [unit, setUnit] = useState("all");
  const [owner, setOwner] = useState("all");
  const [pendingReply, setPendingReply] = useState("all");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [detailRow, setDetailRow] = useState<MasterReportRow | null>(null);
  const [certificateDetail, setCertificateDetail] = useState<CertificateDetail | null>(null);
  const [boardApprovalDetail, setBoardApprovalDetail] = useState<BoardApprovalDetail | null>(null);
  const [incidentDetail, setIncidentDetail] = useState<IncidentReportDetail | null>(null);
  const [portalSignupDetail, setPortalSignupDetail] = useState<PortalSignupRequest | null>(null);
  const [sortKey, setSortKey] = useState<string | undefined>();
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [createPoOpen, setCreatePoOpen] = useState(false);
  const [poPrefill, setPoPrefill] = useState<PurchaseOrderPrefill | undefined>();
  const [relatedServiceRequestPOs, setRelatedServiceRequestPOs] = useState<PurchaseOrder[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [columnPrefsOpen, setColumnPrefsOpen] = useState(false);
  const [bulkArchiveConfirmOpen, setBulkArchiveConfirmOpen] = useState(false);
  const [visibleIncidentColumnKeys, setVisibleIncidentColumnKeys] = useState<Set<string>>(() =>
    loadVisibleColumnKeys(
      INCIDENT_REPORT_COLUMN_PREFS_KEY,
      INCIDENT_REPORT_COLUMN_OPTIONS.map((column) => column.key)
    )
  );
  const remindRowRef = useRef<MasterReportRow | null>(null);

  const tab = route.tab ?? "current";
  const isCertificates = route.reportType === "certificates";
  const isBoardApprovals = route.reportType === "board-approvals";
  const isIncidentReports = route.reportType === "incident-reports";
  const isServiceRequests = route.reportType === "service-requests";
  const isPortalSignups = route.reportType === "portal-signups";
  const isSettingsTab = isCertificates && tab === "settings";
  const hasArchived = ["incident-reports", "service-requests", "board-approvals"].includes(
    route.reportType
  );
  const isAmenity = route.reportType === "amenity-reservations";

  const reloadRows = useCallback(() => {
    if (isSettingsTab) return;
    companyRepository
      .getMasterReports(route.reportType, {
        buildingId: buildingId !== "all" ? buildingId : undefined,
        tab,
      })
      .then((result) => setRows(result.rows))
      .catch(() => setRows([]));
  }, [route.reportType, tab, buildingId, isSettingsTab]);

  const refreshCertificateDetail = useCallback(() => {
    if (!detailRow) return;
    companyRepository.getCertificateDetail(detailRow.id).then((d) => setCertificateDetail(d ?? null));
    reloadRows();
  }, [detailRow, reloadRows]);

  const refreshBoardApprovalDetail = useCallback(() => {
    if (!detailRow) return;
    companyRepository.getBoardApprovalDetail(detailRow.id).then((d) => setBoardApprovalDetail(d ?? null));
    reloadRows();
  }, [detailRow, reloadRows]);

  const refreshIncidentDetail = useCallback(() => {
    if (!detailRow) return;
    companyRepository.getIncidentReportDetail(detailRow.id).then((d) => setIncidentDetail(d ?? null));
    reloadRows();
  }, [detailRow, reloadRows]);

  useEffect(() => {
    companyRepository.getMasterReportBuildings().then(setBuildings);
  }, []);

  useEffect(() => {
    setPageSize(isCertificates ? 5 : 10);
    setPage(1);
  }, [route.reportType]);

  useEffect(() => {
    if (isCertificates) {
      setSortKey(tab === "archived" ? "requested" : "due");
      setSortDir(tab === "archived" ? "desc" : "asc");
    } else if (isBoardApprovals) {
      setSortKey("created");
      setSortDir("desc");
    } else if (isIncidentReports) {
      setSortKey("id");
      setSortDir("desc");
    } else {
      setSortKey(undefined);
      setSortDir("asc");
    }
  }, [isCertificates, isBoardApprovals, isIncidentReports, tab]);

  useEffect(() => {
    if (isSettingsTab) {
      setRows([]);
      return;
    }
    companyRepository
      .getMasterReports(route.reportType, {
        buildingId: buildingId !== "all" ? buildingId : undefined,
        tab,
      })
      .then((result) => setRows(result.rows))
      .catch(() => setRows([]));
  }, [route.reportType, tab, buildingId, isSettingsTab]);

  const filtered = rows.filter((r) => {
    if (hasArchived || isCertificates) {
      const wantArchived = tab === "archived" || tab === "past" || tab === "cancelled";
      if (wantArchived && !r.archived) return false;
      if (!wantArchived && r.archived) return false;
    }
    if (isAmenity) {
      if (tab === "cancelled" && r.status !== "Cancelled") return false;
      if (tab !== "cancelled" && r.status === "Cancelled") return false;
    }
    if (status !== "all" && r.status !== status) return false;
    if (severity !== "all" && (r.severity ?? "") !== severity) return false;
    if (isIncidentReports || isServiceRequests) {
      if (unit !== "all" && (r.unit ?? "") !== unit) return false;
      if (owner !== "all" && (r.owner ?? "") !== owner) return false;
    }
    if (pendingReply !== "all") {
      if (isIncidentReports) {
        const label = r.pendingReplyLabel ?? (r.pendingReply ? "Yes" : "No");
        if (pendingReply === "Yes" && label !== "Yes") return false;
        if (pendingReply === "No" && label !== "No" && label !== "N/A") return false;
      } else {
        const expected = pendingReply === "yes";
        if ((r.pendingReply ?? false) !== expected) return false;
      }
    }
    return true;
  });

  const title = getMasterReportTitle(route.reportType);

  const openCertificateView = useCallback((row: MasterReportRow) => {
    setDetailRow(row);
    setCertificateDetail(null);
    setBoardApprovalDetail(null);
    setIncidentDetail(null);
    setDetailLoading(true);
    companyRepository
      .getCertificateDetail(row.id)
      .then((d) => setCertificateDetail(d ?? null))
      .finally(() => setDetailLoading(false));
  }, []);

  const openBoardApprovalView = useCallback((row: MasterReportRow) => {
    setDetailRow(row);
    setCertificateDetail(null);
    setBoardApprovalDetail(null);
    setIncidentDetail(null);
    setDetailLoading(true);
    companyRepository
      .getBoardApprovalDetail(row.id)
      .then((d) => setBoardApprovalDetail(d ?? null))
      .finally(() => setDetailLoading(false));
  }, []);

  const openIncidentReportView = useCallback((row: MasterReportRow) => {
    setDetailRow(row);
    setCertificateDetail(null);
    setBoardApprovalDetail(null);
    setIncidentDetail(null);
    setDetailLoading(true);
    companyRepository
      .getIncidentReportDetail(row.id)
      .then((d) => setIncidentDetail(d ?? null))
      .finally(() => setDetailLoading(false));
  }, []);

  const openServiceRequestView = useCallback((row: MasterReportRow) => {
    setDetailRow(row);
    setCertificateDetail(null);
    setBoardApprovalDetail(null);
    setIncidentDetail(null);
    setPortalSignupDetail(null);
  }, []);

  const openPortalSignupView = useCallback((row: MasterReportRow) => {
    setDetailRow(row);
    setCertificateDetail(null);
    setBoardApprovalDetail(null);
    setIncidentDetail(null);
    setPortalSignupDetail(null);
    setDetailLoading(true);
    companyRepository
      .getPortalSignupRequest(row.id)
      .then((d) => setPortalSignupDetail(d ?? null))
      .finally(() => setDetailLoading(false));
  }, []);

  const loadRelatedServiceRequestPOs = useCallback((requestId: string) => {
    companyRepository
      .getPurchaseOrdersBySourceRequest("company-service-request", requestId)
      .then(setRelatedServiceRequestPOs);
  }, []);

  useEffect(() => {
    if (!isServiceRequests || !detailRow) {
      setRelatedServiceRequestPOs([]);
      return;
    }
    loadRelatedServiceRequestPOs(detailRow.id);
  }, [detailRow, isServiceRequests, loadRelatedServiceRequestPOs]);

  const openCreatePOForServiceRequest = useCallback((row: MasterReportRow) => {
    const notes = [
      `Generated from service request ${row.id}`,
      row.unit ? `Unit: ${row.unit}` : undefined,
      row.owner ? `Owner: ${row.owner}` : undefined,
      `Description: ${row.title}`,
    ]
      .filter(Boolean)
      .join("\n");
    setPoPrefill({
      buildingId: row.buildingId,
      lockBuilding: true,
      sourceRequest: { kind: "company-service-request", requestId: row.id },
      notes,
    });
    setCreatePoOpen(true);
  }, []);

  const { run: sendVoteReminders } = useAsyncAction(
    useCallback(async () => {
      const row = remindRowRef.current;
      if (!row) return;
      await companyRepository.sendBoardApprovalVoteReminders(row.id);
    }, []),
    { successMessage: "Vote reminders sent." }
  );

  const handleBoardApprovalRemind = useCallback(
    (row: MasterReportRow) => {
      remindRowRef.current = row;
      void sendVoteReminders();
    },
    [sendVoteReminders]
  );

  const { run: bulkArchiveIncidentReports, loading: bulkArchiving } = useAsyncAction(
    useCallback(async () => {
      if (tab !== "current" || filtered.length === 0) return;
      await companyRepository.bulkArchiveIncidentReports(filtered.map((row) => row.id));
      reloadRows();
      setBulkArchiveConfirmOpen(false);
    }, [filtered, reloadRows, tab]),
    { successMessage: "Incident reports archived." }
  );

  const handleExport = () => {
    downloadCsv(
      `${route.reportType}-${tab}.csv`,
      ["ID", "Community", "Date", "Title", "Status", "Unit", "Owner"],
      filtered.map((row) => [
        row.id,
        row.buildingLabel,
        row.date,
        row.title,
        row.status,
        row.unit ?? "",
        row.owner ?? "",
      ])
    );
  };

  const closeDetail = () => {
    setDetailRow(null);
    setCertificateDetail(null);
    setBoardApprovalDetail(null);
    setIncidentDetail(null);
    setPortalSignupDetail(null);
    setDetailLoading(false);
  };

  const columns = useMemo(() => {
    if (isCertificates) return getCertificateColumns(tab, openCertificateView);
    if (isBoardApprovals) return getBoardApprovalColumns(openBoardApprovalView, handleBoardApprovalRemind);
    if (isIncidentReports) return getIncidentReportColumns(openIncidentReportView);
    if (isServiceRequests) return getMasterReportColumns(route.reportType, openServiceRequestView);
    if (isPortalSignups) return getMasterReportColumns(route.reportType, openPortalSignupView);
    return getMasterReportColumns(route.reportType, setDetailRow);
  }, [
    isCertificates,
    isBoardApprovals,
    isIncidentReports,
    isServiceRequests,
    isPortalSignups,
    tab,
    route.reportType,
    openCertificateView,
    openBoardApprovalView,
    openIncidentReportView,
    openServiceRequestView,
    openPortalSignupView,
    handleBoardApprovalRemind,
  ]);

  const visibleColumns = useMemo(() => {
    if (!isIncidentReports) return columns;
    return filterColumnsByKey(columns, visibleIncidentColumnKeys);
  }, [columns, isIncidentReports, visibleIncidentColumnKeys]);

  const filters = getMasterReportFilters({
    reportType: route.reportType,
    rows,
    buildings,
    buildingId,
    onBuildingIdChange: (v) => {
      setBuildingId(v);
      setPage(1);
    },
    status,
    onStatusChange: (v) => {
      setStatus(v);
      setPage(1);
    },
    severity,
    onSeverityChange: (v) => {
      setSeverity(v);
      setPage(1);
    },
    unit,
    onUnitChange: (v) => {
      setUnit(v);
      setPage(1);
    },
    owner,
    onOwnerChange: (v) => {
      setOwner(v);
      setPage(1);
    },
    pendingReply,
    onPendingReplyChange: (v) => {
      setPendingReply(v);
      setPage(1);
    },
  });

  const emptyMessage =
    route.reportType === "amenity-reservations" && tab === "current"
      ? "No Current or Upcoming Reservations"
      : "No data available in table.";

  const genericDetailSrcDoc =
    detailRow &&
    !isCertificates &&
    !isBoardApprovals &&
    !isIncidentReports &&
    !isServiceRequests &&
    `<!doctype html><html><head><meta charset="utf-8" /><title>Detail</title></head><body style="font-family:Arial,Helvetica,sans-serif;padding:16px;">
      <h3 style="margin:0 0 12px 0;">${title}</h3>
      <div style="font-size:14px;line-height:1.5;color:#334155;">
        <div><strong>ID:</strong> ${detailRow.id}</div>
        <div><strong>Community:</strong> ${detailRow.buildingLabel}</div>
        <div><strong>Date:</strong> ${detailRow.date}</div>
        <div><strong>Title:</strong> ${detailRow.title}</div>
        <div><strong>Status:</strong> ${detailRow.status}</div>
        ${detailRow.severity ? `<div><strong>Severity:</strong> ${detailRow.severity}</div>` : ""}
        ${detailRow.unit ? `<div><strong>Owner:</strong> ${detailRow.unit}</div>` : ""}
        ${detailRow.extra ? `<div><strong>Info:</strong> ${detailRow.extra}</div>` : ""}
      </div>
    </body></html>`;

  const amenityPanelTitle =
    tab === "past"
      ? "Past Amenity Reservations"
      : tab === "cancelled"
        ? "Cancelled Amenity Reservations"
        : tab === "archived"
          ? "Archived Amenity Reservations"
          : null;

  const showAmenityEmpty = isAmenity && tab === "current" && filtered.length === 0;

  const handleSortChange = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(
        (isBoardApprovals && key === "created") || (isIncidentReports && key === "id")
          ? "desc"
          : "asc"
      );
    }
  };

  const panelTitle = isCertificates
    ? "Certificates"
    : isBoardApprovals
      ? tab === "archived"
        ? "Archived"
        : "Current"
      : isIncidentReports
        ? "Incident Reports"
        : isAmenity && amenityPanelTitle
          ? amenityPanelTitle
          : hasArchived
            ? tab === "archived"
              ? `Archived ${title}`
              : title
            : title;

  const boardApprovalTabs = isBoardApprovals
    ? [
        { id: "current", label: "Current Board Approvals" },
        { id: "archived", label: "Archived Board Approvals" },
      ]
    : null;

  const incidentTabs = isIncidentReports
    ? [
        { id: "current", label: "Current Incident Reports" },
        { id: "archived", label: "Archived Incident Reports" },
      ]
    : null;

  const searchPlaceholder = isBoardApprovals ? "Search" : "search";

  return (
    <div className="space-y-4">
      <MasterReportHubPanel onNavigate={onNavigate} activeReportType={route.reportType} />

      {(isAmenity || hasArchived || isCertificates) && (
        <AdminTabs
          tabs={
            isAmenity
              ? [
                  { id: "current", label: "Current Reservations" },
                  { id: "past", label: "Past Reservations" },
                  { id: "cancelled", label: "Cancelled Reservations" },
                  { id: "archived", label: "Archived Reservations" },
                ]
              : isCertificates
                ? [
                    { id: "current", label: "Certificate Requests" },
                    { id: "archived", label: "Archived Certificate Requests" },
                    { id: "settings", label: "Certificate Settings" },
                  ]
                : (incidentTabs ?? boardApprovalTabs ?? [
                    { id: "current", label: `Current ${title}` },
                    { id: "archived", label: `Archived ${title}` },
                  ])
          }
          activeTab={tab}
          onChange={(t) =>
            onNavigate({
              page: "master-report-detail",
              reportType: route.reportType,
              tab: t as MasterReportTab,
            })
          }
        />
      )}

      {isIncidentReports && !isSettingsTab && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className="rounded bg-[#337ab7] px-3 py-1.5 text-sm text-white hover:bg-[#286090]"
            onClick={() => setColumnPrefsOpen(true)}
          >
            Change Column Display Defaults
          </button>
          <button
            type="button"
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => setBulkArchiveConfirmOpen(true)}
            disabled={tab !== "current" || filtered.length === 0 || bulkArchiving}
          >
            Archive Incident Reports
          </button>
        </div>
      )}

      {isSettingsTab ? (
        <CertificateSettingsPanel buildingId={buildingId !== "all" ? buildingId : undefined} buildings={buildings} />
      ) : showAmenityEmpty ? (
        <div className="rounded-sm border border-slate-200 bg-white px-6 py-16 shadow-sm">
          <p className="text-center text-base font-semibold text-slate-800">
            No Current or Upcoming Reservations
          </p>
        </div>
      ) : (
        <AdminPanelTable
          title={panelTitle}
          headerColor={
            route.reportType === "incident-reports"
              ? "red"
              : route.reportType === "service-requests"
                ? "orange"
                : route.reportType === "board-approvals"
                  ? "purple"
                  : "purple"
          }
          data={filtered}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={searchPlaceholder}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          page={page}
          onPageChange={setPage}
          filters={isCertificates ? [] : filters}
          columns={visibleColumns}
          emptyMessage={emptyMessage}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={
            isCertificates || isBoardApprovals || isIncidentReports ? handleSortChange : undefined
          }
          toolbarExtra={
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
              onClick={handleExport}
            >
              <FaDownload className="text-slate-500" />
              Export CSV
            </button>
          }
        />
      )}

      {isCertificates ? (
        <CertificateViewModal
          open={!!detailRow}
          detail={certificateDetail}
          loading={detailLoading}
          onClose={closeDetail}
          onRefresh={refreshCertificateDetail}
        />
      ) : isBoardApprovals ? (
        <BoardApprovalViewModal
          open={!!detailRow}
          detail={boardApprovalDetail}
          loading={detailLoading}
          onClose={closeDetail}
          onRefresh={refreshBoardApprovalDetail}
        />
      ) : isIncidentReports ? (
        <IncidentReportViewModal
          open={!!detailRow}
          detail={incidentDetail}
          loading={detailLoading}
          onClose={closeDetail}
          onRefresh={refreshIncidentDetail}
          onViewRelated={(selectedUnit, selectedOwner) => {
            setUnit(selectedUnit);
            setOwner(selectedOwner);
            setPage(1);
            closeDetail();
          }}
        />
      ) : isServiceRequests ? (
        <ServiceRequestViewModal
          open={!!detailRow}
          row={detailRow}
          onClose={closeDetail}
          relatedPurchaseOrders={relatedServiceRequestPOs}
          onGeneratePO={openCreatePOForServiceRequest}
          onViewRelated={(selectedUnit, selectedOwner) => {
            setUnit(selectedUnit);
            setOwner(selectedOwner);
            setPage(1);
            closeDetail();
          }}
        />
      ) : isPortalSignups ? (
        <PortalSignupViewModal
          open={!!detailRow}
          detail={portalSignupDetail}
          loading={detailLoading}
          onClose={closeDetail}
        />
      ) : (
        <Modal open={!!detailRow} onClose={closeDetail} title="Report Details" size="md">
          {genericDetailSrcDoc && (
            <iframe
              title="Report Detail"
              srcDoc={genericDetailSrcDoc}
              className="h-[420px] w-full rounded border border-slate-200"
            />
          )}
        </Modal>
      )}
      <PurchaseOrderFormModal
        open={createPoOpen}
        prefill={poPrefill}
        onClose={() => setCreatePoOpen(false)}
        onSaved={() => {
          if (detailRow) {
            loadRelatedServiceRequestPOs(detailRow.id);
          }
        }}
      />

      <ColumnPrefsModal
        open={columnPrefsOpen}
        onClose={() => setColumnPrefsOpen(false)}
        title="Change Column Display Defaults"
        columns={INCIDENT_REPORT_COLUMN_OPTIONS}
        visibleKeys={visibleIncidentColumnKeys}
        onSave={(keys) => {
          saveVisibleColumnKeys(INCIDENT_REPORT_COLUMN_PREFS_KEY, keys);
          setVisibleIncidentColumnKeys(new Set(keys));
        }}
      />

      <ConfirmModal
        open={bulkArchiveConfirmOpen}
        onClose={() => {
          if (bulkArchiving) return;
          setBulkArchiveConfirmOpen(false);
        }}
        title="Archive Incident Reports"
        message={`Archive ${filtered.length} incident report(s) currently shown in this list?`}
        variant="danger"
        loading={bulkArchiving}
        onConfirm={() => void bulkArchiveIncidentReports()}
      />
    </div>
  );
}
