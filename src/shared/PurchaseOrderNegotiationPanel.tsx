import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionButton } from "./ActionButton";
import { FormAlert } from "./FormAlert";
import { useAsyncAction } from "./useAsyncAction";
import type {
  PoNegotiationLineItem,
  PurchaseOrder,
  PurchaseOrderNegotiation,
  SubmitPoProposalInput,
} from "../resident/data/types";

type NegotiationActor = "company" | "vendor";

type PurchaseOrderNegotiationPanelProps = {
  po: PurchaseOrder;
  actor: NegotiationActor;
  negotiations: PurchaseOrderNegotiation[];
  onRefresh: () => void;
  onSubmitQuote: (input: SubmitPoProposalInput) => Promise<void>;
  onSubmitCounter: (input: SubmitPoProposalInput) => Promise<void>;
  onAccept: () => Promise<void>;
};

function lineItemsFromPo(po: PurchaseOrder, negotiations: PurchaseOrderNegotiation[]): PoNegotiationLineItem[] {
  if (po.status === "negotiating") {
    const lastCompany = [...negotiations].reverse().find((n) => n.authorSide === "company");
    if (lastCompany) return lastCompany.lineItems;
  }
  return po.lineItems.map((li) => ({
    description: li.description,
    quantity: li.quantity,
    unitPrice: li.unitPrice,
  }));
}

function actionLabel(action: PurchaseOrderNegotiation["action"], side: NegotiationActor): string {
  if (action === "accept") return side === "company" ? "Company accepted" : "Vendor accepted";
  if (action === "quote") return "Vendor quote";
  return side === "company" ? "Company counter-offer" : "Vendor counter-offer";
}

export function PurchaseOrderNegotiationPanel({
  po,
  actor,
  negotiations,
  onRefresh,
  onSubmitQuote,
  onSubmitCounter,
  onAccept,
}: PurchaseOrderNegotiationPanelProps) {
  const [draftLines, setDraftLines] = useState<PoNegotiationLineItem[]>(() =>
    lineItemsFromPo(po, negotiations)
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDraftLines(lineItemsFromPo(po, negotiations));
    setMessage("");
  }, [po.id, po.lineItems, po.status, negotiations]);

  const total = useMemo(
    () => draftLines.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0),
    [draftLines]
  );

  const canVendorQuote =
    actor === "vendor" && po.isQuoteRequest && po.status === "sent" && po.awaitingResponseFrom === "vendor";
  const canVendorCounter =
    actor === "vendor" &&
    po.isQuoteRequest &&
    po.status === "negotiating" &&
    po.awaitingResponseFrom === "vendor";
  const canCompanyCounter =
    actor === "company" &&
    po.isQuoteRequest &&
    po.status === "quoted" &&
    po.awaitingResponseFrom === "company";
  const canCompanyAccept =
    actor === "company" &&
    po.isQuoteRequest &&
    po.status === "quoted" &&
    po.awaitingResponseFrom === "company";
  const canVendorAccept =
    actor === "vendor" &&
    po.isQuoteRequest &&
    po.status === "negotiating" &&
    po.awaitingResponseFrom === "vendor";

  const afterSuccess = useCallback(() => {
    onRefresh();
    setMessage("");
  }, [onRefresh]);

  const { run: runQuote, loading: quoting, error: quoteError } = useAsyncAction(
    useCallback(async () => {
      await onSubmitQuote({ lineItems: draftLines, message: message.trim() || undefined });
    }, [draftLines, message, onSubmitQuote]),
    { successMessage: "Quote submitted.", onSuccess: afterSuccess }
  );

  const { run: runCounter, loading: countering, error: counterError } = useAsyncAction(
    useCallback(async () => {
      await onSubmitCounter({ lineItems: draftLines, message: message.trim() || undefined });
    }, [draftLines, message, onSubmitCounter]),
    { successMessage: "Counter-offer sent.", onSuccess: afterSuccess }
  );

  const { run: runAccept, loading: accepting, error: acceptError } = useAsyncAction(
    useCallback(async () => {
      await onAccept();
    }, [onAccept]),
    { successMessage: "Offer accepted.", onSuccess: afterSuccess }
  );

  const busy = quoting || countering || accepting;
  const displayError = quoteError ?? counterError ?? acceptError;

  const updateLine = (index: number, unitPrice: number) => {
    setDraftLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], unitPrice };
      return next;
    });
  };

  if (!po.isQuoteRequest) return null;

  return (
    <div className="mt-4 overflow-hidden rounded border border-slate-200">
      <div className="bg-[#3476ef] px-3 py-2 text-sm font-medium text-white">
        Quote &amp; Negotiation
      </div>
      <div className="space-y-4 bg-white p-4 text-sm">
        {po.status === "sent" && po.awaitingResponseFrom === "vendor" && actor === "company" && (
          <p className="text-slate-600">Awaiting vendor quote for this $0 purchase order.</p>
        )}

        {negotiations.length > 0 && (
          <div className="space-y-3">
            <p className="font-medium text-slate-800">Negotiation history</p>
            {negotiations.map((entry) => (
              <div key={entry.id} className="rounded border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  {entry.createdAt} — {entry.authorName} ({actionLabel(entry.action, entry.authorSide)})
                </p>
                {entry.message ? <p className="mt-1 text-slate-700">{entry.message}</p> : null}
                <p className="mt-1 font-semibold text-slate-800">
                  Proposed total: ${entry.proposedTotal.toFixed(2)}
                </p>
                <ul className="mt-1 text-xs text-slate-600">
                  {entry.lineItems.map((li, i) => (
                    <li key={i}>
                      {li.description}: {li.quantity} × ${li.unitPrice.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {(canVendorQuote || canVendorCounter || canCompanyCounter) && (
          <div className="space-y-3 rounded border border-slate-200 p-3">
            <p className="font-medium text-slate-800">
              {canVendorQuote ? "Submit your quote" : "Propose pricing"}
            </p>
            <table className="w-full border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-2 py-1 text-left">Description</th>
                  <th className="px-2 py-1 text-right">Qty</th>
                  <th className="px-2 py-1 text-right">Unit price</th>
                  <th className="px-2 py-1 text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {draftLines.map((line, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-2 py-1">{line.description}</td>
                    <td className="px-2 py-1 text-right">{line.quantity}</td>
                    <td className="px-2 py-1 text-right">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={line.unitPrice}
                        onChange={(e) => updateLine(i, Number(e.target.value))}
                        className="w-24 rounded border border-slate-300 px-1 py-0.5 text-right"
                      />
                    </td>
                    <td className="px-2 py-1 text-right">
                      ${(line.quantity * line.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-right font-semibold">Total: ${total.toFixed(2)}</p>
            <label className="block">
              Message (optional)
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
                placeholder="Add notes about your pricing…"
              />
            </label>
            {displayError ? <FormAlert message={displayError} /> : null}
            <div className="flex flex-wrap gap-2">
              {canVendorQuote && (
                <ActionButton
                  label="Submit quote"
                  loading={quoting}
                  loadingLabel="Submitting…"
                  disabled={busy || total <= 0}
                  onClick={() => void runQuote()}
                />
              )}
              {(canVendorCounter || canCompanyCounter) && (
                <ActionButton
                  label="Send counter-offer"
                  loading={countering}
                  loadingLabel="Sending…"
                  disabled={busy || total <= 0}
                  onClick={() => void runCounter()}
                />
              )}
            </div>
          </div>
        )}

        {(canCompanyAccept || canVendorAccept) && (
          <div className="rounded border border-green-200 bg-green-50 p-3">
            <p className="mb-2 text-slate-700">
              {canCompanyAccept
                ? `Vendor quoted $${po.total.toFixed(2)}. Accept or send a counter-offer above.`
                : `Company counter-offered. Accept their price or counter above.`}
            </p>
            {displayError ? <FormAlert message={displayError} className="mb-2" /> : null}
            <ActionButton
              label="Accept offer"
              variant="success"
              loading={accepting}
              loadingLabel="Accepting…"
              disabled={busy}
              onClick={() => void runAccept()}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function purchaseOrderStatusLabel(status: PurchaseOrder["status"], isQuoteRequest?: boolean): string {
  const map: Record<PurchaseOrder["status"], string> = {
    draft: "Draft",
    sent: isQuoteRequest ? "Awaiting quote" : "Pending",
    quoted: "Quoted",
    negotiating: "Negotiating",
    accepted: "Accepted",
    declined: "Declined",
  };
  return map[status];
}
