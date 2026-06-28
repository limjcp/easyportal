import type {
  PoNegotiationAction,
  PoNegotiationAuthor,
  PoNegotiationLineItem,
  PurchaseOrder,
  PurchaseOrderNegotiation,
  PurchaseOrderStatus,
  SubmitPoProposalInput,
} from "../../resident/data/types";
import { mapDbError, nowIso, sb } from "./base";

export function computePoTotal(lineItems: PoNegotiationLineItem[]): number {
  return lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
}

function mapNegotiation(row: Record<string, unknown>): PurchaseOrderNegotiation {
  const lineItems = (row.line_items as PoNegotiationLineItem[] | undefined) ?? [];
  return {
    id: row.id as string,
    purchaseOrderId: row.purchase_order_id as string,
    authorSide: row.author_side as PoNegotiationAuthor,
    authorName: row.author_name as string,
    action: row.action as PoNegotiationAction,
    message: (row.message as string) ?? undefined,
    proposedTotal: Number(row.proposed_total),
    lineItems,
    createdAt: String(row.created_at).slice(0, 16).replace("T", " "),
  };
}

async function applyLineItems(
  purchaseOrderId: string,
  lineItems: PoNegotiationLineItem[],
  existingLineItems: PurchaseOrder["lineItems"]
): Promise<void> {
  for (let i = 0; i < existingLineItems.length; i++) {
    const existing = existingLineItems[i];
    const proposed = lineItems[i];
    if (!existing || !proposed) continue;
    const { error } = await sb()
      .from("purchase_order_line_items")
      .update({ unit_price: proposed.unitPrice, quantity: proposed.quantity })
      .eq("id", existing.id);
    mapDbError(error);
  }
}

async function insertNegotiation(
  purchaseOrderId: string,
  authorSide: PoNegotiationAuthor,
  authorName: string,
  action: PoNegotiationAction,
  lineItems: PoNegotiationLineItem[],
  message?: string
): Promise<PurchaseOrderNegotiation> {
  const proposedTotal = computePoTotal(lineItems);
  const { data, error } = await sb()
    .from("purchase_order_negotiations")
    .insert({
      purchase_order_id: purchaseOrderId,
      author_side: authorSide,
      author_name: authorName,
      action,
      message: message?.trim() || null,
      proposed_total: proposedTotal,
      line_items: lineItems,
    })
    .select("*")
    .single();
  mapDbError(error);
  return mapNegotiation(data as Record<string, unknown>);
}

async function notifyVendor(
  vendorId: string,
  poId: string,
  type: "po_counter_offer" | "po_quote_accepted",
  message: string
) {
  const { error } = await sb().from("vendor_notifications").insert({
    vendor_id: vendorId,
    notification_type: type,
    message,
    po_id: poId,
  });
  if (error) {
    console.warn("Failed to create vendor notification:", error.message);
  }
}

async function notifyCompany(
  companyId: string,
  poId: string,
  type: "po_quoted" | "po_counter_offer" | "po_accepted",
  message: string
) {
  const { error } = await sb().from("company_notifications").insert({
    company_id: companyId,
    notification_type: type,
    message,
    po_id: poId,
  });
  if (error) {
    console.warn("Failed to create company notification:", error.message);
  }
}

function mergeProposalWithPoLines(
  po: PurchaseOrder,
  input: SubmitPoProposalInput
): PoNegotiationLineItem[] {
  return po.lineItems.map((li, i) => {
    const draft = input.lineItems[i];
    return {
      description: li.description,
      quantity: draft?.quantity ?? li.quantity,
      unitPrice: draft?.unitPrice ?? li.unitPrice,
    };
  });
}

function assertQuoteFlow(po: PurchaseOrder) {
  if (!po.isQuoteRequest) {
    throw new Error("This purchase order is not a quote request.");
  }
}

export const purchaseOrderNegotiationRepository = {
  async getNegotiations(purchaseOrderId: string): Promise<PurchaseOrderNegotiation[]> {
    const { data, error } = await sb()
      .from("purchase_order_negotiations")
      .select("*")
      .eq("purchase_order_id", purchaseOrderId)
      .order("created_at", { ascending: true });
    mapDbError(error);
    return (data ?? []).map((row) => mapNegotiation(row as Record<string, unknown>));
  },

  async submitVendorQuote(
    po: PurchaseOrder,
    authorName: string,
    input: SubmitPoProposalInput
  ): Promise<void> {
    assertQuoteFlow(po);
    if (po.status !== "sent" || po.awaitingResponseFrom !== "vendor") {
      throw new Error("Not awaiting a vendor quote.");
    }

    const lineItems = mergeProposalWithPoLines(po, input);
    if (computePoTotal(lineItems) <= 0) {
      throw new Error("Quote total must be greater than zero.");
    }

    await applyLineItems(po.id, lineItems, po.lineItems);
    const total = computePoTotal(lineItems);
    const { error } = await sb()
      .from("purchase_orders")
      .update({
        status: "quoted" satisfies PurchaseOrderStatus,
        total,
        awaiting_response_from: "company",
        updated_at: nowIso(),
      })
      .eq("id", po.id);
    mapDbError(error);

    await insertNegotiation(po.id, "vendor", authorName, "quote", lineItems, input.message);

    const { data: poRow } = await sb()
      .from("purchase_orders")
      .select("company_id, po_number")
      .eq("id", po.id)
      .single();
    if (poRow) {
      await notifyCompany(
        poRow.company_id as string,
        po.id,
        "po_quoted",
        `Vendor submitted a quote of $${total.toFixed(2)} for ${poRow.po_number as string}.`
      );
    }
  },

  async submitVendorCounterOffer(
    po: PurchaseOrder,
    authorName: string,
    input: SubmitPoProposalInput
  ): Promise<void> {
    assertQuoteFlow(po);
    if (po.status !== "negotiating" || po.awaitingResponseFrom !== "vendor") {
      throw new Error("Not awaiting a vendor counter-offer.");
    }

    const lineItems = mergeProposalWithPoLines(po, input);
    if (computePoTotal(lineItems) <= 0) {
      throw new Error("Counter-offer total must be greater than zero.");
    }

    await applyLineItems(po.id, lineItems, po.lineItems);
    const total = computePoTotal(lineItems);
    const { error } = await sb()
      .from("purchase_orders")
      .update({
        status: "quoted",
        total,
        awaiting_response_from: "company",
        updated_at: nowIso(),
      })
      .eq("id", po.id);
    mapDbError(error);

    await insertNegotiation(po.id, "vendor", authorName, "counter", lineItems, input.message);
  },

  async submitCompanyCounterOffer(
    po: PurchaseOrder,
    authorName: string,
    input: SubmitPoProposalInput
  ): Promise<void> {
    assertQuoteFlow(po);
    if (po.status !== "quoted" || po.awaitingResponseFrom !== "company") {
      throw new Error("Not awaiting a company counter-offer.");
    }

    const lineItems = mergeProposalWithPoLines(po, input);
    if (computePoTotal(lineItems) <= 0) {
      throw new Error("Counter-offer total must be greater than zero.");
    }

    const total = computePoTotal(lineItems);
    const { error } = await sb()
      .from("purchase_orders")
      .update({
        status: "negotiating",
        awaiting_response_from: "vendor",
        updated_at: nowIso(),
      })
      .eq("id", po.id);
    mapDbError(error);

    await insertNegotiation(po.id, "company", authorName, "counter", lineItems, input.message);

    await notifyVendor(
      po.vendorId,
      po.id,
      "po_counter_offer",
      `Company counter-offered $${total.toFixed(2)} on ${po.poNumber}.`
    );
  },

  async acceptOffer(
    po: PurchaseOrder,
    acceptingSide: PoNegotiationAuthor,
    authorName: string
  ): Promise<void> {
    assertQuoteFlow(po);
    if (!["quoted", "negotiating"].includes(po.status)) {
      throw new Error("No active quote to accept.");
    }

    let lineItems: PoNegotiationLineItem[];

    if (acceptingSide === "company") {
      if (po.awaitingResponseFrom !== "company") {
        throw new Error("Company cannot accept right now.");
      }
      lineItems = po.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
      }));
    } else {
      if (po.awaitingResponseFrom !== "vendor") {
        throw new Error("Vendor cannot accept right now.");
      }
      const negotiations = await this.getNegotiations(po.id);
      const lastCompanyOffer = [...negotiations].reverse().find((n) => n.authorSide === "company");
      if (!lastCompanyOffer) {
        throw new Error("No company counter-offer to accept.");
      }
      lineItems = lastCompanyOffer.lineItems;
      await applyLineItems(po.id, lineItems, po.lineItems);
    }

    const total = computePoTotal(lineItems);
    const { error } = await sb()
      .from("purchase_orders")
      .update({
        status: "accepted",
        total,
        awaiting_response_from: null,
        responded_at: nowIso(),
        updated_at: nowIso(),
      })
      .eq("id", po.id);
    mapDbError(error);

    await insertNegotiation(po.id, acceptingSide, authorName, "accept", lineItems);

    const { data: poRow } = await sb()
      .from("purchase_orders")
      .select("company_id, vendor_id, po_number")
      .eq("id", po.id)
      .single();
    if (poRow) {
      const msg = `${poRow.po_number as string} accepted at $${total.toFixed(2)}.`;
      if (acceptingSide === "company") {
        await notifyVendor(po.vendorId, po.id, "po_quote_accepted", msg);
      } else {
        await notifyCompany(poRow.company_id as string, po.id, "po_accepted", msg);
      }
    }
  },
};

export function prepareQuoteRequestOnSend(total: number): {
  isQuoteRequest: boolean;
  awaitingResponseFrom: PoNegotiationAuthor | null;
} {
  if (total === 0) {
    return { isQuoteRequest: true, awaitingResponseFrom: "vendor" };
  }
  return { isQuoteRequest: false, awaitingResponseFrom: null };
}
