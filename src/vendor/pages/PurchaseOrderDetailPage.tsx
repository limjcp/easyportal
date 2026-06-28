import { useCallback, useEffect, useRef, useState } from "react";
import { ActionButton } from "../../shared/ActionButton";
import { CrudPanel } from "../../shared/CrudPanel";
import { FormAlert } from "../../shared/FormAlert";
import {
  PurchaseOrderNegotiationPanel,
  purchaseOrderStatusLabel,
} from "../../shared/PurchaseOrderNegotiationPanel";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { VendorInvoicePanel } from "../components/VendorInvoicePanel";
import { vendorRepository } from "../data/vendorRepository";
import { ConvertToInvoiceModal } from "../modals/ConvertToInvoiceModal";
import { DeclinePurchaseOrderModal } from "../modals/DeclinePurchaseOrderModal";
import type { VendorRoute } from "../navigation";
import type {
  CompanyBuilding,
  CreateVendorInvoiceInput,
  PurchaseOrder,
  PurchaseOrderNegotiation,
  Vendor,
  VendorInvoice,
  VendorPaymentSettings,
} from "../../resident/data/types";

type PurchaseOrderDetailPageProps = {
  poId: string;
  onNavigate: (route: VendorRoute) => void;
  onRefresh: () => void;
};

export function PurchaseOrderDetailPage({
  poId,
  onNavigate,
  onRefresh,
}: PurchaseOrderDetailPageProps) {
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [negotiations, setNegotiations] = useState<PurchaseOrderNegotiation[]>([]);
  const [building, setBuilding] = useState<CompanyBuilding | undefined>();
  const [vendor, setVendor] = useState<Vendor | undefined>();
  const [invoice, setInvoice] = useState<VendorInvoice | undefined>();
  const [paymentSettings, setPaymentSettings] = useState<VendorPaymentSettings | undefined>();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const declineReasonRef = useRef("");
  const convertInputRef = useRef<
    (CreateVendorInvoiceInput & { logoFile: File | null; logoStoragePath?: string }) | null
  >(null);

  const load = useCallback(() => {
    setLoading(true);
    vendorRepository
      .getPurchaseOrder(poId)
      .then(async (p) => {
        setPo(p ?? null);
        if (p) {
          const [b, negs, inv, v, payment] = await Promise.all([
            vendorRepository.getBuilding(p.buildingId),
            vendorRepository.getPurchaseOrderNegotiations(poId),
            vendorRepository.getInvoiceByPurchaseOrderId(poId),
            vendorRepository.getVendor(),
            vendorRepository.getPaymentSettings(),
          ]);
          setBuilding(b);
          setNegotiations(negs);
          setInvoice(inv);
          setVendor(v);
          setPaymentSettings(payment);
        }
      })
      .finally(() => setLoading(false));
  }, [poId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(() => {
    load();
    onRefresh();
  }, [load, onRefresh]);

  const navigateToActionList = useCallback(() => {
    onRefresh();
    onNavigate({ page: "purchase-orders", tab: "action" });
  }, [onNavigate, onRefresh]);

  const { run: acceptOrder, loading: accepting, error: acceptError } = useAsyncAction(
    useCallback(async () => {
      if (!po) return;
      await vendorRepository.respondToPurchaseOrder(po.id, "accepted");
      navigateToActionList();
    }, [navigateToActionList, po]),
    {
      successMessage: "Purchase order accepted.",
      errorMessage: "Unable to accept purchase order.",
    }
  );

  const { run: declineOrder, loading: declining, error: declineError } = useAsyncAction(
    useCallback(async () => {
      if (!po) return;
      await vendorRepository.respondToPurchaseOrder(
        po.id,
        "declined",
        declineReasonRef.current || undefined
      );
      setDeclineOpen(false);
      navigateToActionList();
    }, [navigateToActionList, po]),
    {
      successMessage: "Purchase order declined.",
      errorMessage: "Unable to decline purchase order.",
    }
  );

  const responding = accepting || declining;
  const displayError = acceptError ?? declineError;

  const handleDecline = (reason: string) => {
    declineReasonRef.current = reason;
    void declineOrder();
  };

  const {
    run: createInvoice,
    loading: creatingInvoice,
    error: createInvoiceError,
  } = useAsyncAction(
    useCallback(async () => {
      const input = convertInputRef.current;
      if (!input) return;
      const created = await vendorRepository.createInvoiceFromPurchaseOrder(poId, input);
      setInvoice(created);
      setConvertOpen(false);
      convertInputRef.current = null;
    }, [poId]),
    {
      successMessage: "Invoice created.",
      errorMessage: "Unable to create invoice.",
    }
  );

  const {
    run: submitInvoice,
    loading: submittingInvoice,
    error: submitInvoiceError,
  } = useAsyncAction(
    useCallback(async () => {
      if (!invoice) return;
      const updated = await vendorRepository.submitInvoiceForPayment(invoice.id);
      setInvoice(updated);
    }, [invoice]),
    {
      successMessage: "Invoice submitted for payment.",
      errorMessage: "Unable to submit invoice for payment.",
    }
  );

  if (!loading && !po) {
    return <p className="text-sm text-slate-600">Purchase order not found.</p>;
  }

  const showStandardActions = po?.status === "sent" && !po?.isQuoteRequest;

  return (
    <CrudPanel loading={loading}>
    {po ? (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="rounded bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white">
          {po.poNumber}
        </div>
        <button
          type="button"
          onClick={() => onNavigate({ page: "purchase-orders", tab: "action" })}
          className="text-sm text-[#0d9488] hover:underline"
        >
          ← Back to list
        </button>
      </div>

      {displayError ? <FormAlert message={displayError} className="mb-4" /> : null}
      {submitInvoiceError ? <FormAlert message={submitInvoiceError} className="mb-4" /> : null}

      <div className="space-y-3 rounded border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p>
          <strong>Status:</strong>{" "}
          <span className="capitalize">
            {po.status === "sent" && !po.isQuoteRequest
              ? "Pending your response"
              : purchaseOrderStatusLabel(po.status, po.isQuoteRequest)}
          </span>
        </p>
        {po.isQuoteRequest && (
          <p className="text-xs text-slate-500">
            This purchase order is a quote request. Submit your pricing below; the company may
            counter-offer until you both agree.
          </p>
        )}
        <p>
          <strong>Building:</strong>{" "}
          {building ? `${building.name} — ${building.address}` : po.buildingId}
        </p>
        <p>
          <strong>Created:</strong> {po.createdAt} by {po.createdBy}
        </p>
        {po.sentAt && (
          <p>
            <strong>Sent:</strong> {po.sentAt}
          </p>
        )}
        {po.respondedAt && (
          <p>
            <strong>Responded:</strong> {po.respondedAt}
          </p>
        )}
        {po.declineReason && (
          <p>
            <strong>Decline reason:</strong> {po.declineReason}
          </p>
        )}

        <table className="w-full border border-slate-200 text-xs">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-2 py-1 text-left">Description</th>
              <th className="px-2 py-1 text-right">Qty</th>
              <th className="px-2 py-1 text-right">Unit</th>
              <th className="px-2 py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {po.lineItems.map((li) => (
              <tr key={li.id} className="border-t border-slate-100">
                <td className="px-2 py-1">{li.description}</td>
                <td className="px-2 py-1 text-right">{li.quantity}</td>
                <td className="px-2 py-1 text-right">${li.unitPrice.toFixed(2)}</td>
                <td className="px-2 py-1 text-right">${(li.quantity * li.unitPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-right font-semibold">Total: ${po.total.toFixed(2)}</p>
        {po.notes && (
          <p>
            <strong>Notes from company:</strong> {po.notes}
          </p>
        )}
      </div>

      <PurchaseOrderNegotiationPanel
        po={po}
        actor="vendor"
        negotiations={negotiations}
        onRefresh={handleRefresh}
        onSubmitQuote={async (input) => {
          await vendorRepository.submitVendorQuote(po.id, input);
        }}
        onSubmitCounter={async (input) => {
          await vendorRepository.submitVendorCounterOffer(po.id, input);
        }}
        onAccept={async () => {
          await vendorRepository.acceptCompanyOffer(po.id);
        }}
      />

      <VendorInvoicePanel
        po={po}
        invoice={invoice}
        vendor={vendor}
        building={building}
        paymentSettings={paymentSettings}
        onNavigate={onNavigate}
        onConvert={() => setConvertOpen(true)}
        onSubmitForPayment={() => void submitInvoice()}
        submitting={submittingInvoice}
      />

      {showStandardActions && (
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton
            label="Decline"
            variant="danger"
            loading={declining}
            disabled={responding}
            onClick={() => setDeclineOpen(true)}
          />
          <ActionButton
            label="Accept order"
            variant="success"
            loadingLabel="Accepting…"
            loading={accepting}
            disabled={responding}
            onClick={() => void acceptOrder()}
          />
        </div>
      )}

      {po.isQuoteRequest && ["sent", "quoted", "negotiating"].includes(po.status) && (
        <div className="mt-4">
          <ActionButton
            label="Decline quote request"
            variant="danger"
            loading={declining}
            disabled={responding}
            onClick={() => setDeclineOpen(true)}
          />
        </div>
      )}

      <DeclinePurchaseOrderModal
        open={declineOpen}
        poNumber={po.poNumber}
        onClose={() => setDeclineOpen(false)}
        onConfirm={handleDecline}
      />

      <ConvertToInvoiceModal
        open={convertOpen}
        poNumber={po.poNumber}
        loading={creatingInvoice}
        error={createInvoiceError}
        paymentSettings={paymentSettings}
        onNavigate={onNavigate}
        onClose={() => setConvertOpen(false)}
        onConfirm={(input) => {
          convertInputRef.current = input;
          void createInvoice();
        }}
      />
    </div>
    ) : null}
    </CrudPanel>
  );
}
