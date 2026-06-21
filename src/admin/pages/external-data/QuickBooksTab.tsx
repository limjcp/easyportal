import { useCallback, useEffect, useRef, useState } from "react";
import { FaCheckCircle, FaLink } from "react-icons/fa";
import { AdminSectionPanel } from "../../components/AdminSectionPanel";
import { Modal } from "../../../shared/Modal";
import { ConfirmModal } from "../../../shared/ConfirmModal";
import { ActionButton } from "../../../shared/ActionButton";
import { useAsyncAction } from "../../../shared/useAsyncAction";
import { useInvalidatePortalQueries } from "../../../shared/queries/useInvalidatePortalQueries";
import { adminRepository } from "../../data/adminRepository";
import type { BuildingExternalData } from "../../../resident/data/types";

const QBO_POLL_MS = 2000;
const QBO_POLL_TIMEOUT_MS = 120_000;

type QuickBooksTabProps = {
  activeBuildingId?: string;
  refreshKey?: number;
};

function formatSyncTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString();
}

export function QuickBooksTab({ activeBuildingId, refreshKey = 0 }: QuickBooksTabProps) {
  const { invalidateBuilding } = useInvalidatePortalQueries();
  const [data, setData] = useState<BuildingExternalData | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [lastSyncLabel, setLastSyncLabel] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const refreshExternalData = useCallback(() => adminRepository.getBuildingExternalData(), []);

  const load = useCallback(() => {
    return refreshExternalData()
      .then((next) => {
        setData(next);
        const synced = formatSyncTime(next.quickbooks.lastSyncedAt);
        if (synced) setLastSyncLabel(synced);
      })
      .catch(() => setData(null));
  }, [refreshExternalData]);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPollingForConnection = useCallback(() => {
    stopPolling();
    const deadline = Date.now() + QBO_POLL_TIMEOUT_MS;
    pollRef.current = window.setInterval(() => {
      if (Date.now() > deadline) {
        stopPolling();
        return;
      }
      void refreshExternalData()
        .then((next) => {
          setData(next);
          if (next.quickbooks.qboConnected) stopPolling();
        })
        .catch(() => {
          // Parent tab only; ignore when building context is unavailable.
        });
    }, QBO_POLL_MS);
  }, [refreshExternalData, stopPolling]);

  const { run: handleImport, loading: importing } = useAsyncAction(
    useCallback(async () => {
      const result = await adminRepository.importQuickBooksUsers();
      setImportOpen(false);
      setLastSyncLabel(new Date().toLocaleString());
      await load();
      invalidateBuilding();
      const occupantTotal = (result.occupantsImported ?? 0) + (result.occupantsUpdated ?? 0);
      alert(
        `Synced ${result.imported} QBO customers and ${result.invoices ?? 0} open invoices. ` +
          `${occupantTotal} occupant record(s) added or updated in Units & Users → Pending.`
      );
    }, [load, invalidateBuilding]),
    { successMessage: "QuickBooks data synced." }
  );

  const { run: handleConnect, loading: connecting } = useAsyncAction(
    useCallback(async () => {
      const url = await adminRepository.getQuickBooksOAuthUrl();
      window.open(url, "_blank", "width=900,height=720");
      startPollingForConnection();
    }, [startPollingForConnection]),
    { showSuccessToast: false }
  );

  const { run: handleDisconnect, loading: disconnecting } = useAsyncAction(
    useCallback(async () => {
      const updated = await adminRepository.disconnectQuickBooksOnline();
      setData(updated);
      setDisconnectOpen(false);
    }, []),
    { successMessage: "QuickBooks disconnected." }
  );

  useEffect(() => {
    void load();
  }, [load, activeBuildingId, refreshKey]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "qbo-connected") void load();
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      stopPolling();
    };
  }, [load, stopPolling]);

  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  const qb = data.quickbooks;
  const cachedCount = qb.syncedCustomerCount ?? 0;

  return (
    <>
      <AdminSectionPanel title="QuickBooks Data Links" icon={<FaLink />}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded border border-slate-200 bg-[#2ca01c] px-2 text-center text-xs font-bold leading-tight text-white">
            QuickBooks
          </div>
          <p className="text-sm text-slate-700">
            <strong>
              Connect QuickBooks Online to sync customer balances and open invoices. Synced occupants appear
              under Units &amp; Users → Pending and remain in EasyPortal even if QuickBooks is disconnected
              later.
            </strong>
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl">
          <AdminSectionPanel title="QuickBooks Online Data Link" icon={<FaLink />}>
            <p className="text-center text-sm text-slate-600">
              Connect your QuickBooks company to pull customers and open invoices. Residents can see balances
              after you assign them to units and activate their portal access.
            </p>

            {cachedCount > 0 && (
              <p className="mt-4 text-center text-sm text-slate-600">
                {cachedCount} QBO customer{cachedCount === 1 ? "" : "s"} cached
                {qb.companyId ? ` (Company ID ${qb.companyId})` : ""}.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {qb.qboConnected ? (
                <>
                  <span className="inline-flex cursor-default items-center gap-2 rounded bg-[#89c64c] px-4 py-2 text-sm font-medium text-white">
                    <FaCheckCircle />
                    QB Link Current
                  </span>
                  <ActionButton
                    label="Sync balances & invoices"
                    loading={importing}
                    onClick={() => setImportOpen(true)}
                  />
                  <ActionButton
                    label={disconnecting ? "Disconnecting…" : "Disconnect"}
                    loading={disconnecting}
                    loadingLabel="Disconnecting…"
                    variant="secondary"
                    onClick={() => setDisconnectOpen(true)}
                  />
                </>
              ) : (
                <>
                  <ActionButton
                    label={connecting ? "Opening QuickBooks…" : "Connect to QuickBooks Online"}
                    loading={connecting}
                    loadingLabel="Opening QuickBooks…"
                    onClick={() => void handleConnect()}
                  />
                  {cachedCount > 0 && (
                    <span className="text-xs text-slate-500">
                      Live link is off; cached data and pending occupants are still available.
                    </span>
                  )}
                </>
              )}
            </div>
            {lastSyncLabel && (
              <p className="mt-4 text-center text-xs text-slate-500">Last sync: {lastSyncLabel}</p>
            )}
          </AdminSectionPanel>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          * QuickBooks does not support unique fields for unit/suite/apt number. Users must be manually assigned
          to their units in EasyPortal.
          <br />
          ** Only users saved as Owners or Absentee Owners are allowed to see account balances &amp; invoices.
          <br />
          *** Disconnecting stops live API sync only. Imported occupants, cached customers, and invoice data
          already stored in EasyPortal are not removed.
        </p>
      </AdminSectionPanel>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Sync Balances & Invoices"
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <ActionButton
              label="Start Sync"
              loadingLabel="Syncing…"
              loading={importing}
              onClick={() => void handleImport()}
            />
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          This pulls QuickBooks Online customers and open invoices into EasyPortal, and creates or updates
          pending occupant records under Units &amp; Users. Re-syncing updates names and emails without
          removing existing records.
        </p>
      </Modal>

      <ConfirmModal
        open={disconnectOpen}
        onClose={() => {
          if (disconnecting) return;
          setDisconnectOpen(false);
        }}
        title="Disconnect QuickBooks"
        message="Disconnect the live QuickBooks link? Synced occupants and cached balances will stay in EasyPortal."
        variant="danger"
        loading={disconnecting}
        onConfirm={() => void handleDisconnect()}
      />
    </>
  );
}
