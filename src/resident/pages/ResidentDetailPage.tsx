import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "../../shared/EmptyState";
import { Modal } from "../../shared/Modal";
import { SaveBar } from "../../shared/SaveBar";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { useBusyWhile } from "../../shared/useBusyWhile";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { usePortalConfig } from "../context/PortalConfigContext";
import { residentRepo } from "../data/mockRepository";
import { getDetailSectionConfig } from "../data/residentDetailConfig";
import type {
  ParkingRequest,
  ParkingRequestType,
  ResidentDetailSection,
  ResidentDetailSectionData,
  ResidentProfileDetails,
} from "../data/types";

const inputClass =
  "rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 [color-scheme:light] disabled:bg-slate-50 disabled:text-slate-500";

type ResidentDetailPageProps = {
  section: ResidentDetailSection;
};

type ScheduleMonthState = {
  monthKey: string;
  label: string;
  isPaid: boolean;
  inPayableWindow: boolean;
  amount: string;
};

export function ResidentDetailPage({ section }: ResidentDetailPageProps) {
  const config = getDetailSectionConfig(section);
  const { profileFieldOptions } = usePortalConfig();
  const fieldOption = profileFieldOptions.find((f) => f.fieldKey === section);
  const editable = fieldOption?.editable ?? false;

  const [details, setDetails] = useState<ResidentProfileDetails | null>(null);
  const [draft, setDraft] = useState<ResidentDetailSectionData | null>(null);
  const [saved, setSaved] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [selectedFeeYear, setSelectedFeeYear] = useState(new Date().getFullYear());
  const [customFeeAmount, setCustomFeeAmount] = useState("");
  const [activeScheduleMonth, setActiveScheduleMonth] = useState<ScheduleMonthState | null>(null);
  const [parkingRequests, setParkingRequests] = useState<ParkingRequest[]>([]);
  const [visitorOvernightEmail, setVisitorOvernightEmail] = useState("support@mvpcondos.com");
  const [parkingTab, setParkingTab] = useState<"requests" | "rental">("requests");
  const [parkingNightNotes, setParkingNightNotes] = useState("");
  const [parkingRequestingType, setParkingRequestingType] = useState<ParkingRequestType | null>(null);
  const [parkingActionRequestId, setParkingActionRequestId] = useState<string | null>(null);
  const [parkingNotice, setParkingNotice] = useState<string | null>(null);
  const [parkingError, setParkingError] = useState<string | null>(null);
  const [qboSnapshot, setQboSnapshot] = useState<Awaited<ReturnType<typeof residentRepo.getQuickBooksAccountSnapshot>> | null>(null);

  useEffect(() => {
    Promise.all([
      residentRepo.getResidentDetails(),
      section === "parkingSpots" ? residentRepo.getParkingRequestsForCurrentResident() : Promise.resolve([]),
      section === "parkingSpots"
        ? residentRepo.getVisitorParkingOvernightEmail()
        : Promise.resolve("support@mvpcondos.com"),
      section === "purchaseDateMaintFees"
        ? residentRepo.getQuickBooksAccountSnapshot().catch(() => null)
        : Promise.resolve(null),
    ]).then(([data, requests, overnightEmail, snapshot]) => {
      setDetails(data);
      setDraft(structuredClone(data[section]));
      setParkingRequests(requests);
      setVisitorOvernightEmail(overnightEmail);
      setQboSnapshot(snapshot);
      setSelectedFeeYear(new Date().getFullYear());
      setCustomFeeAmount("");
      setActiveScheduleMonth(null);
      setParkingNightNotes("");
      setSaved(false);
      setPaymentNotice(null);
      setParkingNotice(null);
      setParkingError(null);
    });
  }, [section]);

  const { run: handleSave, loading: saving, error: saveError } = useAsyncAction(
    useCallback(async () => {
      if (!editable || draft === null) return;
      await residentRepo.updateResidentDetailSection(section, draft);
      const updated = await residentRepo.getResidentDetails();
      setDetails(updated);
      setDraft(structuredClone(updated[section]));
    }, [draft, editable, section]),
    {
      successMessage: "Saved successfully.",
      errorMessage: "Unable to save changes.",
      onSuccess: () => setSaved(true),
    }
  );

  const applyCondoFeePayment = async (
    amount: number,
    label: string,
    options?: {
      monthsToMark?: number;
      explicitMonthKeys?: string[];
      advanceNextDate?: boolean;
      enforceMinimum?: boolean;
    }
  ) => {
    if (section !== "purchaseDateMaintFees") return;
    const fees = draft as ResidentProfileDetails["purchaseDateMaintFees"];
    const currentBalance = parseCurrency(fees.quickBooksBalance ?? "$0.00");
    const nextPayment = parseCurrency(fees.nextPaymentAmount ?? fees.monthlyFee ?? "$0.00");
    const minimum = Math.max(currentBalance, nextPayment);
    const enforceMinimum = options?.enforceMinimum ?? true;
    if (enforceMinimum && amount < minimum) {
      setPaymentNotice(
        `Payment rejected. Minimum payment is ${formatCurrency(minimum)} based on your current balance and next payment.`
      );
      return;
    }
    const nextBalance = Math.max(0, currentBalance - amount);
    const nextDate =
      options?.advanceNextDate === false ? fees.nextPaymentDate : addOneMonthIso(fees.nextPaymentDate);
    const paidMonthKeys =
      options?.explicitMonthKeys && options.explicitMonthKeys.length > 0
        ? options.explicitMonthKeys
        : getConsecutiveMonthKeys(fees.nextPaymentDate, options?.monthsToMark ?? 1);
    const updatedFees: ResidentProfileDetails["purchaseDateMaintFees"] = {
      ...fees,
      quickBooksBalance: formatCurrency(nextBalance),
      minimumOneTimePayment: formatCurrency(minimum),
      lastPaymentAmount: formatCurrency(amount),
      lastPaymentDate: new Date().toISOString().slice(0, 10),
      nextPaymentDate: nextDate,
      paidMonths: Array.from(new Set([...(fees.paidMonths ?? []), ...paidMonthKeys])),
    };
    setPaymentProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await residentRepo.updateResidentDetailSection("purchaseDateMaintFees", updatedFees);
    const updatedDetails = await residentRepo.getResidentDetails();
    setDetails(updatedDetails);
    setDraft(structuredClone(updatedDetails.purchaseDateMaintFees));
    setPaymentNotice(`${label} payment of ${formatCurrency(amount)} submitted (mock QuickBooks payment).`);
    setPaymentProcessing(false);
  };

  const handlePayMinimum = async () => {
    if (section !== "purchaseDateMaintFees") return;
    const fees = draft as ResidentProfileDetails["purchaseDateMaintFees"];
    const currentBalance = parseCurrency(fees.quickBooksBalance ?? "$0.00");
    const nextPayment = parseCurrency(fees.nextPaymentAmount ?? fees.monthlyFee ?? "$0.00");
    const minimum = Math.max(currentBalance, nextPayment);
    await applyCondoFeePayment(minimum, "Minimum");
  };

  const handlePayAdvance = async () => {
    if (section !== "purchaseDateMaintFees") return;
    const fees = draft as ResidentProfileDetails["purchaseDateMaintFees"];
    const base = parseCurrency(fees.nextPaymentAmount ?? fees.monthlyFee ?? "$0.00");
    const monthly = parseCurrency(fees.monthlyFee ?? "$0.00");
    await applyCondoFeePayment(base + monthly, "Advance", { monthsToMark: 2 });
  };

  const handlePayCustom = async () => {
    const customAmount = parseCurrency(customFeeAmount);
    if (!customAmount) {
      setPaymentNotice("Enter a valid custom amount before submitting.");
      return;
    }
    await applyCondoFeePayment(customAmount, "Custom");
    setCustomFeeAmount("");
  };

  const handleScheduleMonthClick = (month: ScheduleMonthState) => {
    setActiveScheduleMonth(month);
  };

  const handlePayScheduleMonth = async () => {
    if (!activeScheduleMonth || section !== "purchaseDateMaintFees") return;
    if (!activeScheduleMonth.inPayableWindow || activeScheduleMonth.isPaid) return;
    const fees = draft as ResidentProfileDetails["purchaseDateMaintFees"];
    const monthlyAmount = parseCurrency(fees.monthlyFee ?? "$0.00");
    if (!monthlyAmount) {
      setPaymentNotice("Monthly fee amount is missing.");
      return;
    }
    await applyCondoFeePayment(monthlyAmount, `Selected month (${activeScheduleMonth.label})`, {
      explicitMonthKeys: [activeScheduleMonth.monthKey],
      advanceNextDate: false,
      enforceMinimum: false,
    });
    const refreshedDetails = await residentRepo.getResidentDetails();
    const refreshedFees = refreshedDetails.purchaseDateMaintFees;
    const refreshedPaidSet = new Set(refreshedFees.paidMonths ?? []);
    setActiveScheduleMonth({
      ...activeScheduleMonth,
      isPaid: refreshedPaidSet.has(activeScheduleMonth.monthKey),
    });
  };

  const handleParkingRequest = async (requestType: ParkingRequestType) => {
    setParkingError(null);
    setParkingNotice(null);
    setParkingRequestingType(requestType);
    try {
      await residentRepo.submitParkingRequest(requestType, {
        requestedForNights: parkingNightNotes,
      });
      const [updatedDetails, requests] = await Promise.all([
        residentRepo.getResidentDetails(),
        residentRepo.getParkingRequestsForCurrentResident(),
      ]);
      setDetails(updatedDetails);
      setDraft(structuredClone(updatedDetails[section]));
      setParkingRequests(requests);
      setParkingNotice(
        requestType === "parking"
          ? "Parking request submitted and added to waitlist."
          : "Visitor parking request submitted and added to waitlist."
      );
      setParkingNightNotes("");
    } catch (error) {
      setParkingError(error instanceof Error ? error.message : "Unable to submit parking request.");
    } finally {
      setParkingRequestingType(null);
    }
  };

  const handleAcceptAndPayParking = async (requestId: string) => {
    setParkingActionRequestId(requestId);
    setParkingNotice(null);
    setParkingError(null);
    try {
      await residentRepo.acceptParkingRequestPayment(requestId);
      const [updatedDetails, requests] = await Promise.all([
        residentRepo.getResidentDetails(),
        residentRepo.getParkingRequestsForCurrentResident(),
      ]);
      setDetails(updatedDetails);
      setDraft(structuredClone(updatedDetails[section]));
      setParkingRequests(requests);
      setParkingNotice("Parking offer accepted and payment completed.");
    } catch (error) {
      setParkingError(error instanceof Error ? error.message : "Unable to complete payment.");
    } finally {
      setParkingActionRequestId(null);
    }
  };

  const handleDeclineParkingOffer = async (requestId: string) => {
    setParkingActionRequestId(requestId);
    setParkingNotice(null);
    setParkingError(null);
    try {
      await residentRepo.declineParkingRequestOffer(requestId);
      const requests = await residentRepo.getParkingRequestsForCurrentResident();
      setParkingRequests(requests);
      setParkingNotice("Parking offer declined and moved to the bottom of the waitlist.");
    } catch (error) {
      setParkingError(error instanceof Error ? error.message : "Unable to decline this offer.");
    } finally {
      setParkingActionRequestId(null);
    }
  };

  useBusyWhile(details === null || draft === null);

  if (details === null || draft === null) {
    return null;
  }

  return (
    <div className="rounded-sm bg-white/95 p-4 shadow-lg">
      <ModuleMessageBanner moduleId={config.moduleId} />
      {!editable && (
        <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This information is view-only. Contact building management to make changes.
        </p>
      )}
      {config.formType === "stringList" && section !== "parkingSpots" && (
        <StringListForm
          config={config}
          values={draft as string[]}
          editable={editable}
          onChange={setDraft}
        />
      )}
      {section === "parkingSpots" && (
        <ParkingRequestSection
          assignedSpots={draft as string[]}
          requests={parkingRequests}
          tab={parkingTab}
          onTabChange={setParkingTab}
          parkingNightNotes={parkingNightNotes}
          onParkingNightNotesChange={setParkingNightNotes}
          visitorOvernightEmail={visitorOvernightEmail}
          requestingType={parkingRequestingType}
          notice={parkingNotice}
          error={parkingError}
          actionRequestId={parkingActionRequestId}
          onRequestParking={() => handleParkingRequest("parking")}
          onRequestVisitorParking={() => handleParkingRequest("visitor")}
          onAcceptAndPay={handleAcceptAndPayParking}
          onDeclineOffer={handleDeclineParkingOffer}
        />
      )}
      {config.formType === "objectList" && (
        <ObjectListForm
          config={config}
          items={draft as unknown as Record<string, string>[]}
          editable={editable}
          onChange={setDraft}
        />
      )}
      {config.formType === "single" && (
        <SingleRecordForm
          config={config}
          values={draft as unknown as Record<string, string>}
          editable={editable}
          onChange={setDraft}
        />
      )}
      {section === "purchaseDateMaintFees" && (
        <>
          <CondoFeesPaymentPanel
            values={draft as ResidentProfileDetails["purchaseDateMaintFees"]}
            selectedYear={selectedFeeYear}
            onYearChange={setSelectedFeeYear}
            customAmount={customFeeAmount}
            onCustomAmountChange={setCustomFeeAmount}
            paymentProcessing={paymentProcessing}
            paymentNotice={paymentNotice}
            onPayMinimum={handlePayMinimum}
            onPayAdvance={handlePayAdvance}
            onPayCustom={handlePayCustom}
            onMonthClick={handleScheduleMonthClick}
          />

          <div className="mt-4 rounded border border-slate-200 bg-white p-3">
            <h4 className="text-sm font-semibold text-slate-800">Open invoices (QuickBooks Online)</h4>
            {!qboSnapshot ? (
              <p className="mt-2 text-sm text-slate-500">Loading…</p>
            ) : !qboSnapshot.connected ? (
              <p className="mt-2 text-sm text-slate-500">
                QuickBooks is not connected (or your unit is not mapped yet).
              </p>
            ) : qboSnapshot.invoices.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No open invoices found.</p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded border border-slate-200">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="border-b border-slate-200 px-3 py-2 text-left">Invoice</th>
                      <th className="border-b border-slate-200 px-3 py-2 text-left">Txn date</th>
                      <th className="border-b border-slate-200 px-3 py-2 text-left">Due date</th>
                      <th className="border-b border-slate-200 px-3 py-2 text-left">Total</th>
                      <th className="border-b border-slate-200 px-3 py-2 text-left">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qboSnapshot.invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="border-b border-slate-100 px-3 py-2">{inv.docNumber || inv.id}</td>
                        <td className="border-b border-slate-100 px-3 py-2">{inv.txnDate || "—"}</td>
                        <td className="border-b border-slate-100 px-3 py-2">{inv.dueDate || "—"}</td>
                        <td className="border-b border-slate-100 px-3 py-2">${inv.total.toFixed(2)}</td>
                        <td className="border-b border-slate-100 px-3 py-2">${inv.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      {editable && section !== "parkingSpots" && (
        <div className="mt-6">
          <SaveBar
            onSave={() => void handleSave()}
            saved={saved}
            saving={saving}
            error={saveError}
            label="Save"
            loadingLabel="Saving…"
          />
        </div>
      )}
      <Modal
        open={!!activeScheduleMonth}
        onClose={() => setActiveScheduleMonth(null)}
        title={activeScheduleMonth ? `Condo Fee - ${activeScheduleMonth.label}` : "Condo Fee"}
        size="md"
      >
        {activeScheduleMonth && (
          <div className="space-y-3 text-sm">
            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-500">Month</p>
              <p className="font-semibold text-slate-800">{activeScheduleMonth.label}</p>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-500">Amount</p>
              <p className={`font-semibold ${activeScheduleMonth.isPaid ? "text-emerald-600" : "text-slate-800"}`}>
                {activeScheduleMonth.amount}
              </p>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-500">Status</p>
              <p className="font-semibold text-slate-800">
                {!activeScheduleMonth.inPayableWindow
                  ? "N/A (outside payable window)"
                  : activeScheduleMonth.isPaid
                    ? "Paid"
                    : "Unpaid"}
              </p>
            </div>
            {activeScheduleMonth.inPayableWindow && !activeScheduleMonth.isPaid && (
              <button
                type="button"
                onClick={handlePayScheduleMonth}
                disabled={paymentProcessing}
                className="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {paymentProcessing ? "Processing..." : `Pay ${activeScheduleMonth.amount}`}
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function ParkingRequestSection({
  assignedSpots,
  requests,
  tab,
  onTabChange,
  parkingNightNotes,
  onParkingNightNotesChange,
  visitorOvernightEmail,
  requestingType,
  notice,
  error,
  actionRequestId,
  onRequestParking,
  onRequestVisitorParking,
  onAcceptAndPay,
  onDeclineOffer,
}: {
  assignedSpots: string[];
  requests: ParkingRequest[];
  tab: "requests" | "rental";
  onTabChange: (tab: "requests" | "rental") => void;
  parkingNightNotes: string;
  onParkingNightNotesChange: (value: string) => void;
  visitorOvernightEmail: string;
  requestingType: ParkingRequestType | null;
  notice: string | null;
  error: string | null;
  actionRequestId: string | null;
  onRequestParking: () => void;
  onRequestVisitorParking: () => void;
  onAcceptAndPay: (requestId: string) => void;
  onDeclineOffer: (requestId: string) => void;
}) {
  const hasAssignedParking = assignedSpots.length > 0;
  const regularMonthly = requests.find((request) => request.requestType === "parking")?.monthlyCost ?? "$120.00";
  const visitorMonthly = requests.find((request) => request.requestType === "visitor")?.monthlyCost ?? "$30.00";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onTabChange("requests")}
          className={`rounded px-3 py-1.5 text-sm ${
            tab === "requests" ? "bg-[#3476ef] text-white" : "border border-slate-300 bg-white text-slate-700"
          }`}
        >
          Parking Requests
        </button>
        <button
          type="button"
          onClick={() => onTabChange("rental")}
          className={`rounded px-3 py-1.5 text-sm ${
            tab === "rental" ? "bg-[#3476ef] text-white" : "border border-slate-300 bg-white text-slate-700"
          }`}
        >
          Rental Parking
        </button>
      </div>

      {tab === "rental" ? (
        <div className="rounded border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Rental Parking Rates</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded bg-white px-3 py-2">
              <p className="text-xs text-slate-500">Regular parking monthly cost</p>
              <p className="text-base font-semibold text-slate-900">{regularMonthly}</p>
            </div>
            <div className="rounded bg-white px-3 py-2">
              <p className="text-xs text-slate-500">Visitor parking monthly cost</p>
              <p className="text-base font-semibold text-slate-900">{visitorMonthly}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Need overnight visitor parking? Email <span className="font-semibold">{visitorOvernightEmail}</span> with
            visitor details and the night schedule.
          </p>
        </div>
      ) : (
        <>
      <div className="rounded border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Assigned Parking</p>
        {hasAssignedParking ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {assignedSpots.map((spot) => (
              <span key={spot} className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700">
                {spot}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No parking assigned yet.</p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Parking changes are managed by admin assignment only. Residents cannot remove assigned parking.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRequestParking}
          disabled={requestingType !== null}
          className="rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf] disabled:opacity-60"
        >
          {requestingType === "parking" ? "Requesting..." : "Request Parking"}
        </button>
        {hasAssignedParking && (
          <button
            type="button"
            onClick={onRequestVisitorParking}
            disabled={requestingType !== null}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {requestingType === "visitor" ? "Requesting..." : "Request Visitor Parking"}
          </button>
        )}
      </div>

      <div className="rounded border border-slate-200 bg-white p-3">
        <label className="block text-sm font-medium text-slate-700">
          Parking night details
          <input
            type="text"
            value={parkingNightNotes}
            onChange={(event) => onParkingNightNotesChange(event.target.value)}
            placeholder="Ex: Overnight Fri-Sun, 10 PM to 7 AM"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
          />
        </label>
        <p className="mt-1 text-xs text-slate-500">This note is sent with your next parking or visitor request.</p>
      </div>

      {notice && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="rounded border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-800">Parking Request History</p>
        {requests.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No parking requests yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {requests.map((request) => (
              <div key={request.id} className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-800">
                    {request.requestType === "parking" ? "Parking" : "Visitor Parking"}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      request.status === "waiting"
                        ? "bg-amber-100 text-amber-800"
                        : request.status === "approvedAwaitingPayment"
                          ? "bg-blue-100 text-blue-800"
                          : request.status === "paidAccepted"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {request.status === "waiting"
                      ? "Waiting"
                      : request.status === "approvedAwaitingPayment"
                        ? "Approved - Awaiting Payment"
                        : request.status === "paidAccepted"
                          ? "Paid & Accepted"
                          : "Declined"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Requested: {formatRequestDate(request.requestedAt)}</p>
                {request.requestedForNights && (
                  <p className="mt-1 text-xs text-slate-700">
                    Schedule: <span className="font-medium">{request.requestedForNights}</span>
                  </p>
                )}
                {request.status === "waiting" && request.waitlistPosition && (
                  <p className="mt-1 text-xs text-slate-700">
                    Waitlist position: <span className="font-semibold">{ordinal(request.waitlistPosition)}</span>
                  </p>
                )}
                {request.assignedSpot && (
                  <p className="mt-1 text-xs text-slate-700">
                    Assigned spot: <span className="font-medium">{request.assignedSpot}</span>
                  </p>
                )}
                {request.status === "approvedAwaitingPayment" && (
                  <>
                    <p className="mt-1 text-xs text-slate-700">
                      Amount due: <span className="font-medium">{request.paymentAmount ?? "$0.00"}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-700">
                      Monthly cost: <span className="font-medium">{request.monthlyCost ?? "$0.00"}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onAcceptAndPay(request.id)}
                        disabled={actionRequestId === request.id}
                        className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {actionRequestId === request.id ? "Processing..." : "Accept & Pay"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeclineOffer(request.id)}
                        disabled={actionRequestId === request.id}
                        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                      >
                        Decline and move to bottom
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}

function formatRequestDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseCurrency(value: string): number {
  const normalized = value.replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(value);
}

function addOneMonthIso(dateValue?: string): string | undefined {
  if (!dateValue) return undefined;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  parsed.setMonth(parsed.getMonth() + 1);
  return parsed.toISOString().slice(0, 10);
}

function getConsecutiveMonthKeys(startDate: string | undefined, count: number): string[] {
  const parsed = startDate ? new Date(startDate) : new Date();
  if (Number.isNaN(parsed.getTime())) return [];
  const safeCount = Math.max(1, Math.floor(count));
  const keys: string[] = [];
  const cursor = new Date(parsed);
  for (let i = 0; i < safeCount; i += 1) {
    keys.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}

function monthKeyToLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const monthIndex = Number(month) - 1;
  if (!year || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex >= monthNames.length) {
    return monthKey;
  }
  return `${monthNames[monthIndex]} ${year}`;
}

function ordinal(value: number): string {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return `${value}st`;
  if (mod10 === 2 && mod100 !== 12) return `${value}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${value}rd`;
  return `${value}th`;
}

function CondoFeesPaymentPanel({
  values,
  selectedYear,
  onYearChange,
  customAmount,
  onCustomAmountChange,
  paymentProcessing,
  paymentNotice,
  onPayMinimum,
  onPayAdvance,
  onPayCustom,
  onMonthClick,
}: {
  values: ResidentProfileDetails["purchaseDateMaintFees"];
  selectedYear: number;
  onYearChange: (year: number) => void;
  customAmount: string;
  onCustomAmountChange: (amount: string) => void;
  paymentProcessing: boolean;
  paymentNotice: string | null;
  onPayMinimum: () => void;
  onPayAdvance: () => void;
  onPayCustom: () => void;
  onMonthClick: (month: ScheduleMonthState) => void;
}) {
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];
  const minimumPayment = Math.max(
    parseCurrency(values.quickBooksBalance ?? "$0.00"),
    parseCurrency(values.nextPaymentAmount ?? values.monthlyFee ?? "$0.00")
  );
  const nextPaymentAmount = parseCurrency(values.nextPaymentAmount ?? values.monthlyFee ?? "$0.00");
  const advanceAmount = nextPaymentAmount + parseCurrency(values.monthlyFee ?? "$0.00");
  const paidMonthSet = new Set(values.paidMonths ?? []);

  return (
    <div className="mt-5 rounded border border-emerald-100 bg-emerald-50/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        QuickBooks Mock Summary
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded bg-white px-3 py-2">
          <p className="text-xs text-slate-500">Current balance</p>
          <p className="text-base font-semibold text-slate-900">
            {values.quickBooksBalance ?? "$0.00"}
          </p>
        </div>
        <div className="rounded bg-white px-3 py-2">
          <p className="text-xs text-slate-500">Next payment amount</p>
          <p className="text-base font-semibold text-slate-900">
            {values.nextPaymentAmount ?? values.monthlyFee ?? "$0.00"}
          </p>
        </div>
        <div className="rounded bg-white px-3 py-2">
          <p className="text-xs text-slate-500">Next payment date</p>
          <p className="text-base font-semibold text-slate-900">
            {values.nextPaymentDate ?? "Not scheduled"}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-700">
          Payment year
          <select
            value={selectedYear}
            onChange={(event) => onYearChange(Number(event.target.value))}
            className="ml-2 rounded border border-slate-300 bg-white px-2 py-1"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onPayMinimum}
          disabled={paymentProcessing}
          className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {paymentProcessing ? "Processing..." : `Pay minimum (${formatCurrency(minimumPayment)})`}
        </button>
        <button
          type="button"
          onClick={onPayAdvance}
          disabled={paymentProcessing}
          className="rounded border border-emerald-500 bg-white px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
        >
          Pay in advance ({formatCurrency(advanceAmount)})
        </button>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customAmount}
            onChange={(event) => onCustomAmountChange(event.target.value)}
            placeholder="Custom amount"
            className="rounded border border-slate-300 bg-white px-3 py-2 text-black text-sm"
          />
          <button
            type="button"
            onClick={onPayCustom}
            disabled={paymentProcessing}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            Pay custom
          </button>
        </div>
        <span className="text-xs text-slate-600">Minimum payable is current balance or next payment balance.</span>
      </div>
      <div className="mt-4 rounded border border-slate-200 bg-white p-3">
        <p className="text-sm font-semibold text-slate-800">{selectedYear} Monthly Schedule</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {monthNames.map((month, index) => (
            <button
              type="button"
              key={`${selectedYear}-${month}`}
              onClick={() => {
                const monthKey = `${selectedYear}-${String(index + 1).padStart(2, "0")}`;
                const inPayableWindow = selectedYear === currentYear;
                const isPaid = inPayableWindow && paidMonthSet.has(monthKey);
                onMonthClick({
                  monthKey,
                  label: monthKeyToLabel(monthKey),
                  inPayableWindow,
                  isPaid,
                  amount: inPayableWindow ? values.monthlyFee ?? "$0.00" : "N/A",
                });
              }}
              className="rounded border border-slate-200 px-3 py-2 text-left text-sm transition hover:border-[#3476ef] hover:bg-blue-50"
            >
              {(() => {
                const monthKey = `${selectedYear}-${String(index + 1).padStart(2, "0")}`;
                const inPayableWindow = selectedYear === currentYear;
                const isPaid = inPayableWindow && paidMonthSet.has(monthKey);
                return (
                  <>
                    <p className="text-xs text-slate-500">{month}</p>
                    <p className={`font-semibold ${isPaid ? "text-emerald-600" : "text-slate-900"}`}>
                      {inPayableWindow ? values.monthlyFee ?? "$0.00" : "N/A"}
                    </p>
                    {inPayableWindow && isPaid && (
                      <p className="mt-1 inline-flex rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        Paid
                      </p>
                    )}
                    {inPayableWindow && !isPaid && (
                      <p className="mt-1 inline-flex rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        Unpaid
                      </p>
                    )}
                    {selectedYear !== currentYear && index === 0 && (
                      <p className="mt-1 text-[11px] text-slate-500">Outside 12-month payable window</p>
                    )}
                  </>
                );
              })()}
            </button>
          ))}
        </div>
      </div>
      {paymentNotice && <p className="mt-3 text-sm text-emerald-700">{paymentNotice}</p>}
    </div>
  );
}

function StringListForm({
  config,
  values,
  editable,
  onChange,
}: {
  config: Extract<ReturnType<typeof getDetailSectionConfig>, { formType: "stringList" }>;
  values: string[];
  editable: boolean;
  onChange: (data: string[]) => void;
}) {
  const update = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    onChange(next);
  };

  const add = () => onChange([...values, ""]);
  const remove = (index: number) => onChange(values.filter((_, i) => i !== index));

  if (values.length === 0 && !editable) {
    return (
      <EmptyState title={`No ${config.title.toLowerCase()} on file`} subtitle="Nothing has been entered yet." />
    );
  }

  return (
    <div className="space-y-3">
      {values.length === 0 && editable && (
        <p className="text-sm text-slate-500">No entries yet. Click Add to create one.</p>
      )}
      {values.map((value, index) => (
        <div key={index} className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">{config.itemLabel}</span>
            <input
              type="text"
              value={value}
              disabled={!editable}
              placeholder={config.placeholder}
              onChange={(e) => update(index, e.target.value)}
              className={inputClass}
            />
          </label>
          {editable && (
            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-6 self-start rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      {editable && (
        <button
          type="button"
          onClick={add}
          className="rounded border border-dashed border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          + Add
        </button>
      )}
    </div>
  );
}

function ObjectListForm({
  config,
  items,
  editable,
  onChange,
}: {
  config: Extract<ReturnType<typeof getDetailSectionConfig>, { formType: "objectList" }>;
  items: Record<string, string>[];
  editable: boolean;
  onChange: (data: ResidentDetailSectionData) => void;
}) {
  const maxItems = config.maxItems;
  const atMax = maxItems !== undefined && items.length >= maxItems;

  const updateField = (index: number, key: string, value: string) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    onChange(next as unknown as ResidentDetailSectionData);
  };

  const add = () => {
    if (atMax) return;
    const empty: Record<string, string> = { id: String(Date.now()) };
    for (const f of config.fields) empty[f.key] = "";
    onChange([...items, empty] as unknown as ResidentDetailSectionData);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index) as unknown as ResidentDetailSectionData);
  };

  if (items.length === 0 && !editable) {
    return <EmptyState title={config.emptyTitle} subtitle={config.emptySubtitle} />;
  }

  return (
    <div className="space-y-6">
      {items.length === 0 && editable && (
        <EmptyState
          title={config.emptyTitle}
          subtitle={config.emptySubtitle}
          action={
            <button
              type="button"
              onClick={add}
              className="rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf]"
            >
              + Add
            </button>
          }
        />
      )}
      {items.map((item, index) => (
        <div key={item.id ?? index} className="rounded border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              {config.title} #{index + 1}
            </span>
            {editable && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-xs text-slate-500 hover:text-red-600"
              >
                Remove
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {config.fields.map((field) => (
              <label key={field.key} className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-600">{field.label}</span>
                <input
                  type={field.type ?? "text"}
                  value={item[field.key] ?? ""}
                  disabled={!editable}
                  placeholder={field.placeholder}
                  onChange={(e) => updateField(index, field.key, e.target.value)}
                  className={inputClass}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      {editable && items.length > 0 && !atMax && (
        <button
          type="button"
          onClick={add}
          className="rounded border border-dashed border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          + Add
        </button>
      )}
      {editable && atMax && items.length > 0 && (
        <p className="text-xs text-slate-500">Maximum of {maxItems} entries reached.</p>
      )}
    </div>
  );
}

function SingleRecordForm({
  config,
  values,
  editable,
  onChange,
}: {
  config: Extract<ReturnType<typeof getDetailSectionConfig>, { formType: "single" }>;
  values: Record<string, string>;
  editable: boolean;
  onChange: (data: ResidentDetailSectionData) => void;
}) {
  const update = (key: string, value: string) => {
    onChange({ ...values, [key]: value } as unknown as ResidentDetailSectionData);
  };

  return (
    <div className="grid max-w-lg gap-4">
      {config.fields.map((field) => (
        <label key={field.key} className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">{field.label}</span>
          <input
            type={field.key === "purchaseDate" ? "date" : field.type ?? "text"}
            value={values[field.key] ?? ""}
            disabled={!editable}
            placeholder={field.placeholder}
            onChange={(e) => update(field.key, e.target.value)}
            className={inputClass}
          />
        </label>
      ))}
    </div>
  );
}
