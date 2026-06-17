import { useEffect, useState } from "react";
import { FaCheckCircle, FaLink, FaSync, FaTimes } from "react-icons/fa";
import { AdminSectionPanel } from "../../components/AdminSectionPanel";
import { Modal } from "../../../shared/Modal";
import { adminRepository } from "../../data/adminRepository";
import type { BuildingExternalData } from "../../../resident/data/types";

export function QuickBooksTab() {
  const [data, setData] = useState<BuildingExternalData | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const load = () => adminRepository.getBuildingExternalData().then(setData);

  useEffect(() => {
    load();
  }, []);

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await adminRepository.importQuickBooksUsers();
      setImportOpen(false);
      setLastSync(new Date().toLocaleString());
      alert(`Synced ${result.imported} customers and ${result.invoices ?? 0} open invoices from QuickBooks.`);
    } finally {
      setImporting(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const url = await adminRepository.getQuickBooksOAuthUrl();
      window.open(url, "_blank", "width=900,height=720");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect QuickBooks Online from this building?")) return;
    setDisconnecting(true);
    try {
      const updated = await adminRepository.disconnectQuickBooksOnline();
      setData(updated);
    } finally {
      setDisconnecting(false);
    }
  };

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
              Does your building use QuickBooks for accounting purposes? With Condo Communities QuickBooks
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
              as updates to, customer/user records are shared between Condo Communities and Quickbooks in
              real-time***.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {data.quickbooks.qboConnected ? (
                <>
                  <span className="inline-flex cursor-default items-center gap-2 rounded bg-[#89c64c] px-4 py-2 text-sm font-medium text-white">
                    <FaCheckCircle />
                    QB Link Current
                  </span>
                  <button
                    type="button"
                    onClick={() => setImportOpen(true)}
                    className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf]"
                  >
                    <FaSync />
                    Sync balances & invoices
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <FaTimes />
                    {disconnecting ? "Disconnecting…" : "Disconnect"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf]"
                >
                  <FaLink />
                  {connecting ? "Opening QuickBooks…" : "Connect to QuickBooks Online"}
                </button>
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
          manually assigned to their units in Condo Communities.
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
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf] disabled:opacity-60"
            >
              {importing ? "Importing…" : "Start Import"}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          This will pull QuickBooks Online customers + open invoices and store them in EasyPortal so balances and
          invoices can be displayed.
        </p>
      </Modal>
    </>
  );
}
