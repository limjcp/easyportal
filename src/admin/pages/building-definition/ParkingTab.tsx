import { useEffect, useState } from "react";
import { FaCar } from "react-icons/fa";
import { AdminFormPanel, InfoBanner, StepCard } from "../../components/AdminFormPanel";
import { adminRepository } from "../../data/adminRepository";
import type {
  AddUnitRangeType,
  BuildingParkingGroup,
  ParkingRequest,
} from "../../../resident/data/types";

type ParkingTabProps = {
  refreshKey: number;
  onRefresh: () => void;
};

export function ParkingTab({ refreshKey, onRefresh }: ParkingTabProps) {
  const [groups, setGroups] = useState<BuildingParkingGroup[]>([]);
  const [parkingRequests, setParkingRequests] = useState<ParkingRequest[]>([]);
  const [visitorParking, setVisitorParking] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [floor, setFloor] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [addType, setAddType] = useState<AddUnitRangeType>("all");
  const [assigningRequestId, setAssigningRequestId] = useState<string | null>(null);
  const [selectedSpotByRequestId, setSelectedSpotByRequestId] = useState<Record<string, string>>({});
  const [assignmentNotice, setAssignmentNotice] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [regularMonthlyCost, setRegularMonthlyCost] = useState("$120.00");
  const [visitorMonthlyCost, setVisitorMonthlyCost] = useState("$30.00");
  const [pricingSaving, setPricingSaving] = useState(false);
  const [condoFeeAmount, setCondoFeeAmount] = useState("$485.00");
  const [condoFeeSaving, setCondoFeeSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      adminRepository.getBuildingParking(),
      adminRepository.getParkingRequests(),
      adminRepository.getBuildingParkingPricing(),
      adminRepository.getResidentCondoFeeAmount(),
    ]).then(([parkingGroups, requests, pricing, monthlyFee]) => {
        setGroups(parkingGroups);
        setParkingRequests(requests);
        setRegularMonthlyCost(pricing.regularMonthlyCost);
        setVisitorMonthlyCost(pricing.visitorMonthlyCost);
        setCondoFeeAmount(monthlyFee);
      });
  }, [refreshKey]);

  const refreshParkingData = async () => {
    const [parkingGroups, requests] = await Promise.all([
      adminRepository.getBuildingParking(),
      adminRepository.getParkingRequests(),
    ]);
    setGroups(parkingGroups);
    setParkingRequests(requests);
  };

  const handleAdd = async () => {
    if (!floor.trim() || !start.trim() || !end.trim()) {
      alert("Floor/Area, Start, and End are required.");
      return;
    }
    await adminRepository.addBuildingParking({
      floorArea: floor.trim(),
      start,
      end,
      addType,
      prefix,
      visitorParking,
    });
    setFloor("");
    setStart("");
    setEnd("");
    await refreshParkingData();
    onRefresh();
  };

  const handleAssignRequest = async (requestId: string) => {
    const assignedSpot = selectedSpotByRequestId[requestId];
    if (!assignedSpot) {
      setAssignmentError("Please select a parking space before assigning.");
      return;
    }
    setAssignmentError(null);
    setAssignmentNotice(null);
    setAssigningRequestId(requestId);
    try {
      await adminRepository.assignParkingRequest(requestId, assignedSpot);
      await refreshParkingData();
      setAssignmentNotice(`Assigned ${assignedSpot} successfully.`);
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Unable to assign parking request.");
    } finally {
      setAssigningRequestId(null);
    }
  };

  const handleSavePricing = async () => {
    setPricingSaving(true);
    await adminRepository.updateBuildingParkingPricing({
      regularMonthlyCost,
      visitorMonthlyCost,
    });
    setPricingSaving(false);
    setAssignmentNotice("Parking monthly pricing updated.");
  };

  const handleSaveCondoFeeAmount = async () => {
    setCondoFeeSaving(true);
    await adminRepository.updateResidentCondoFeeAmount(condoFeeAmount);
    setCondoFeeSaving(false);
    setAssignmentNotice("Condo fee amount updated.");
  };

  const assignedParkingSpots = new Set(
    parkingRequests
      .filter(
        (request) =>
          request.requestType === "parking" &&
          (request.status === "approvedAwaitingPayment" || request.status === "paidAccepted")
      )
      .map((request) => request.assignedSpot)
      .filter((spot): spot is string => Boolean(spot))
  );
  const assignedVisitorSpots = new Set(
    parkingRequests
      .filter(
        (request) =>
          request.requestType === "visitor" &&
          (request.status === "approvedAwaitingPayment" || request.status === "paidAccepted")
      )
      .map((request) => request.assignedSpot)
      .filter((spot): spot is string => Boolean(spot))
  );
  const regularSpots = groups.filter((group) => !group.visitorParking).flatMap((group) => group.spaces);
  const visitorSpots = groups.filter((group) => group.visitorParking).flatMap((group) => group.spaces);
  const waitingRequests = parkingRequests.filter((request) => request.status === "waiting");
  const pendingPaymentRequests = parkingRequests.filter(
    (request) => request.status === "approvedAwaitingPayment"
  );
  const completedRequests = parkingRequests.filter(
    (request) => request.status === "paidAccepted" || request.status === "declined"
  );

  return (
    <div className="space-y-4">
      <InfoBanner
        icon={<FaCar />}
        title="Parking Definition"
        subtitle="Define your parking spaces here."
      />

      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
        <StepCard step={1} text="Enter the first and last parking space for each floor/area." />
        <StepCard step={2} text="Once added, you can edit or delete any spaces that need adjustment." />
        <StepCard step={3} text="Continue until all parking spaces have been added!" />
      </div>

      <AdminFormPanel title="Add Parking:" headerColor="primary">
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={visitorParking} onChange={(e) => setVisitorParking(e.target.checked)} />
          Visitor Parking
        </label>
        <div className="mb-3">
          <label className="block text-sm">
            Prefix
            <input value={prefix} onChange={(e) => setPrefix(e.target.value)} className="mt-1 w-full max-w-xs rounded border border-slate-300 px-3 py-1.5" />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="block text-sm">
            Floor/Area
            <input value={floor} onChange={(e) => setFloor(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-center" />
          </label>
          <label className="block text-sm">
            Start
            <input value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-center" />
          </label>
          <label className="block text-sm">
            End
            <input value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-center" />
          </label>
          <label className="block text-sm">
            Add
            <select value={addType} onChange={(e) => setAddType(e.target.value as AddUnitRangeType)} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5">
              <option value="all">All Spaces</option>
              <option value="even">Only Even</option>
              <option value="odd">Only Odd</option>
            </select>
          </label>
        </div>
        <button type="button" onClick={handleAdd} className="mt-4 rounded bg-[#89c64c] px-4 py-2 text-sm text-white">
          Add Parking
        </button>
      </AdminFormPanel>

      <AdminFormPanel title="Parking Monthly Costs:" headerColor="primary">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Regular Parking Monthly Cost
            <input
              value={regularMonthlyCost}
              onChange={(event) => setRegularMonthlyCost(event.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Visitor Parking Monthly Cost
            <input
              value={visitorMonthlyCost}
              onChange={(event) => setVisitorMonthlyCost(event.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={handleSavePricing}
          disabled={pricingSaving}
          className="mt-4 rounded bg-[#3476ef] px-4 py-2 text-sm text-white hover:bg-[#2d68cf] disabled:opacity-60"
        >
          {pricingSaving ? "Saving..." : "Save Monthly Costs"}
        </button>
      </AdminFormPanel>

      <AdminFormPanel title="Condo Fee Amount (Admin Override):" headerColor="primary">
        <label className="block text-sm">
          Monthly Condo Fee
          <input
            value={condoFeeAmount}
            onChange={(event) => setCondoFeeAmount(event.target.value)}
            className="mt-1 w-full max-w-sm rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
        <button
          type="button"
          onClick={handleSaveCondoFeeAmount}
          disabled={condoFeeSaving}
          className="mt-4 rounded bg-[#3476ef] px-4 py-2 text-sm text-white hover:bg-[#2d68cf] disabled:opacity-60"
        >
          {condoFeeSaving ? "Saving..." : "Save Condo Fee Amount"}
        </button>
      </AdminFormPanel>

      <AdminFormPanel title="Current Parking Spaces:" headerColor="primary">
        <div className="mb-3 flex gap-2">
          {["Unassigned", "Assigned", "Visitor"].map((f) => (
            <span key={f} className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600">{f}</span>
          ))}
        </div>
        {groups.length === 0 ? (
          <p className="py-8 text-center text-slate-500">No parking spaces defined yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-2 text-center font-medium">Floor/Area</th>
                <th className="px-4 py-2 font-medium">Spaces</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-center">
                    <span className="rounded bg-[#3476ef] px-2 py-0.5 text-xs font-medium text-white">{g.floorArea}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {g.spaces.map((s) => (
                        <span key={s} className="rounded border border-slate-300 px-2 py-0.5 text-xs">{s}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminFormPanel>

      <AdminFormPanel title="Parking Request Waitlist:" headerColor="primary">
        {assignmentNotice && (
          <p className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {assignmentNotice}
          </p>
        )}
        {assignmentError && (
          <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {assignmentError}
          </p>
        )}
        {waitingRequests.length === 0 ? (
          <p className="py-6 text-center text-slate-500">No waiting parking requests.</p>
        ) : (
          <div className="space-y-3">
            {waitingRequests.map((request) => {
              const options =
                request.requestType === "visitor"
                  ? visitorSpots.filter((spot) => !assignedVisitorSpots.has(spot))
                  : regularSpots.filter((spot) => !assignedParkingSpots.has(spot));
              return (
                <div key={request.id} className="rounded border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {request.residentName} (Unit {request.unit})
                      </p>
                      <p className="text-xs text-slate-500">
                        {request.requestType === "visitor" ? "Visitor parking request" : "Parking request"} -{" "}
                        {request.requestedAt}
                      </p>
                <p className="text-xs text-slate-500">
                  Waitlist position:{" "}
                  {
                    waitingRequests
                      .filter((item) => item.requestType === request.requestType)
                      .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))
                      .findIndex((item) => item.id === request.id) + 1
                  }
                </p>
                {request.requestedForNights && (
                  <p className="text-xs text-slate-600">Requested nights: {request.requestedForNights}</p>
                )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedSpotByRequestId[request.id] ?? ""}
                        onChange={(event) =>
                          setSelectedSpotByRequestId((prev) => ({
                            ...prev,
                            [request.id]: event.target.value,
                          }))
                        }
                        className="rounded border border-slate-300 px-2 py-1 text-sm"
                      >
                        <option value="">Select spot</option>
                        {options.map((spot) => (
                          <option key={spot} value={spot}>
                            {spot}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAssignRequest(request.id)}
                        disabled={assigningRequestId === request.id || options.length === 0}
                        className="rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white hover:bg-[#2d68cf] disabled:opacity-60"
                      >
                        {assigningRequestId === request.id ? "Assigning..." : "Assign"}
                      </button>
                    </div>
                  </div>
                  {options.length === 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      No available {request.requestType === "visitor" ? "visitor" : "regular"} spots to assign.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AdminFormPanel>

      <AdminFormPanel title="Resident Payment Pending:" headerColor="primary">
        {pendingPaymentRequests.length === 0 ? (
          <p className="py-6 text-center text-slate-500">No approvals awaiting resident payment.</p>
        ) : (
          <div className="space-y-3">
            {pendingPaymentRequests.map((request) => (
              <div key={request.id} className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                <p className="font-semibold text-slate-800">
                  {request.residentName} (Unit {request.unit}) -{" "}
                  {request.requestType === "parking" ? "Parking" : "Visitor Parking"}
                </p>
                <p className="text-xs text-slate-700">
                  Spot: {request.assignedSpot ?? "N/A"} | Amount Due: {request.paymentAmount ?? "$0.00"}
                </p>
                <p className="text-xs text-slate-700">Monthly Cost: {request.monthlyCost ?? "$0.00"}</p>
                <p className="text-xs text-slate-600">
                  Approved: {request.approvedAt ? new Date(request.approvedAt).toLocaleString() : "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}
      </AdminFormPanel>

      <AdminFormPanel title="Parking Request Outcomes:" headerColor="primary">
        {completedRequests.length === 0 ? (
          <p className="py-6 text-center text-slate-500">No completed parking request outcomes yet.</p>
        ) : (
          <div className="space-y-3">
            {completedRequests.map((request) => (
              <div key={request.id} className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <p className="font-semibold text-slate-800">
                  {request.residentName} (Unit {request.unit}) -{" "}
                  {request.requestType === "parking" ? "Parking" : "Visitor Parking"}
                </p>
                <p className="text-xs text-slate-700">
                  Status: {request.status === "paidAccepted" ? "Paid and accepted" : "Declined"} | Spot:{" "}
                  {request.assignedSpot ?? "N/A"}
                </p>
                {request.status === "paidAccepted" && (
                  <p className="text-xs text-slate-600">
                    Paid: {request.paymentAt ? new Date(request.paymentAt).toLocaleString() : "N/A"}
                  </p>
                )}
                {request.status === "declined" && (
                  <p className="text-xs text-slate-600">
                    Declined:{" "}
                    {request.residentDecisionAt
                      ? new Date(request.residentDecisionAt).toLocaleString()
                      : "N/A"}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </AdminFormPanel>
    </div>
  );
}
