import { useCallback, useEffect, useRef, useState } from "react";
import { FaCheckCircle, FaLink, FaSync, FaTimes } from "react-icons/fa";
import { AdminSectionPanel } from "../../components/AdminSectionPanel";
import { Modal } from "../../../shared/Modal";
import { ConfirmModal } from "../../../shared/ConfirmModal";
import { ActionButton } from "../../../shared/ActionButton";
import { useAsyncAction } from "../../../shared/useAsyncAction";
import { adminRepository } from "../../data/adminRepository";
import type { BuildingExternalData } from "../../../resident/data/types";

const QBO_POLL_MS = 2000;
const QBO_POLL_TIMEOUT_MS = 120_000;

export function QuickBooksTab() {
  const [data, setData] = useState<BuildingExternalData | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const { run: handleImport, loading: importing } = useAsyncAction(
    useCallback(async () => {
      const result = await adminRepository.importQuickBooksUsers();
      setImportOpen(false);
      setLastSync(new Date().toLocaleString());
      alert(`Synced ${result.imported} customers and ${result.invoices ?? 0} open invoices from QuickBooks.`);
    }, []),
    { successMessage: "QuickBooks data imported." }
  );

  const { run: handleConnect, loading: connecting } = useAsyncAction(
    useCallback(async () => {
      const url = await adminRepository.getQuickBooksOAuthUrl();
      window.open(url, "_blank", "width=900,height=720");
      startPollingForConnection();
    }, []),
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

  const refreshExternalData = () => adminRepository.getBuildingExternalData();

  const load = () =>
    refreshExternalData()
      .then(setData)
      .catch(() => setData(null));

  const stopPolling = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPollingForConnection = () => {
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
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "qbo-connected") void load();
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      stopPolling();
    };
  }, []);

  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <>
      <AdminSectionPanel title="QuickBooks Data Links" icon={<FaLink />}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded border border-slate-200 bg-[#2ca01c] px-2 text-center text-xs font-bold leading-tight text-white">
            QuickBooks
          </div>
          <p className="text-sm text-slate-700">
            <strong>
              Does your building use QuickBooks for accounting purposes? With EasyPortal QuickBooks
              integration you can eliminate dual data entry*, while also allowing residents to see their account
              balance and open invoices. Simply enable either QuickBooks Online or the QuickBooks Web Connector
              in the options below to get started!
            </strong>
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl">
          <AdminSectionPanel title="QuickBooks Online Data Link" icon={<FaLink />}>
            <p className="text-center text-sm text-slate-600">
              By enabling Quickbooks Online and entering your Quickbooks Online CompanyID, you can allow
              residents to see their current account balance and any outstanding invoices**. Creation of, as well
              as updates to, customer/user records are shared between EasyPortal and Quickbooks in
              real-time***.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {data.quickbooks.qboConnected ? (
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
                <ActionButton
                  label={connecting ? "Opening QuickBooks…" : "Connect to QuickBooks Online"}
                  loading={connecting}
                  loadingLabel="Opening QuickBooks…"
                  onClick={() => void handleConnect()}
                />
              )}
            </div>
            {lastSync && (
              <p className="mt-4 text-center text-xs text-slate-500">Last sync: {lastSync}</p>
            )}
          </AdminSectionPanel>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          * QuickBooks does not support unique fields for unit/suite/apt number. Due to this, as well as the
          variability of address formatting used by countries and regions around the world, users must be
          manually assigned to their units in EasyPortal.
          <br />
          ** Only users saved as Owners or Absentee Owners are allowed to see account balances &amp; invoices.
          <br />
          *** Dependant on Quickbooks API availability and uptime. Some delays may occur.
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
              label="Start Import"
              loadingLabel="Importing…"
              loading={importing}
              onClick={() => void handleImport()}
            />
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          This will pull QuickBooks Online customers + open invoices and store them in EasyPortal so balances and
          invoices can be displayed.
        </p>
      </Modal>

      <ConfirmModal
        open={disconnectOpen}
        onClose={() => {
          if (disconnecting) return;
          setDisconnectOpen(false);
        }}
        title="Disconnect QuickBooks"
        message="Disconnect QuickBooks Online from this building?"
        variant="danger"
        loading={disconnecting}
        onConfirm={() => void handleDisconnect()}
      />
    </>
  );
}
