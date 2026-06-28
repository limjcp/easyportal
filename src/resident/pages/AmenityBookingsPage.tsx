import { useCallback, useRef, useState } from "react";
import { CrudPanel } from "../../shared/CrudPanel";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { useResidentAmenityBookingsData } from "../../shared/queries/residentListQueries";
import { useInvalidatePortalQueries } from "../../shared/queries/useInvalidatePortalQueries";
import { isQueryPageLoading } from "../../shared/useQueryPageBusy";
import { useSyncFromRefreshKey } from "../../shared/useSyncFromRefreshKey";
import { useTabChangeWithBusy } from "../../shared/useTabChangeWithBusy";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { residentRepo } from "../data/mockRepository";
import type {
  AmenityBooking,
  SubmitElevatorBookingInput,
  SubmitPartyRoomBookingInput,
} from "../data/types";

type TabId = "elevator" | "party-room" | "my-bookings";

const TABS: { id: TabId; label: string }[] = [
  { id: "elevator", label: "Book Elevator" },
  { id: "party-room", label: "Book Party Room" },
  { id: "my-bookings", label: "My Bookings" },
];

function labelType(type: AmenityBooking["bookingType"]) {
  return type === "elevator" ? "Elevator" : "Party Room";
}

function labelStatus(status: AmenityBooking["status"]) {
  switch (status) {
    case "pending":
      return "Pending review";
    case "approvedAwaitingPayment":
      return "Awaiting payment";
    case "confirmed":
      return "Confirmed";
    case "declined":
      return "Declined";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function statusClass(status: AmenityBooking["status"]) {
  if (status === "confirmed") return "bg-green-100 text-green-800";
  if (status === "approvedAwaitingPayment") return "bg-yellow-100 text-yellow-800";
  if (status === "pending") return "bg-blue-100 text-blue-800";
  if (status === "declined" || status === "cancelled") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-800";
}

export function AmenityBookingsPage({ refreshKey = 0 }: { refreshKey?: number }) {
  const { invalidateBuilding } = useInvalidatePortalQueries();
  const bookingsQuery = useResidentAmenityBookingsData();
  const { data, refetch } = bookingsQuery;
  const pageLoading = isQueryPageLoading(bookingsQuery);
  const settings = data?.settings ?? {
    partyRoomFee: "",
    elevatorInstructions: "",
    partyRoomInstructions: "",
  };
  const bookings = data?.bookings ?? [];
  const elevators = data?.elevators ?? [];
  const partyRooms = data?.partyRooms ?? [];
  const [tab, setTab] = useState<TabId>("elevator");
  const [elevatorForm, setElevatorForm] = useState<SubmitElevatorBookingInput>({
    amenityResourceId: "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    notes: "",
  });
  const [partyForm, setPartyForm] = useState<SubmitPartyRoomBookingInput>({
    amenityResourceId: "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    guestCount: undefined,
    notes: "",
  });
  const [error, setPageError] = useState<string | null>(null);
  const actionBookingIdRef = useRef<string>("");

  const reload = useCallback(async () => {
    invalidateBuilding();
    await refetch();
  }, [invalidateBuilding, refetch]);

  useSyncFromRefreshKey(refreshKey, () => void reload());

  const clearPageError = () => setPageError(null);
  const handleTabChange = useTabChangeWithBusy((next: TabId) => {
    setTab(next);
    clearPageError();
  });

  const { run: submitElevator, loading: submittingElevator } = useAsyncAction(
    useCallback(async () => {
      await residentRepo.submitElevatorBooking(elevatorForm);
      setElevatorForm({ amenityResourceId: "", bookingDate: "", startTime: "", endTime: "", notes: "" });
      setTab("my-bookings");
      await reload();
    }, [elevatorForm, reload]),
    {
      successMessage: "Elevator booking submitted for review.",
      errorMessage: "Unable to submit booking.",
      onError: (message) => setPageError(message),
    }
  );

  const { run: submitPartyRoom, loading: submittingPartyRoom } = useAsyncAction(
    useCallback(async () => {
      await residentRepo.submitPartyRoomBooking(partyForm);
      setPartyForm({
        amenityResourceId: "",
        bookingDate: "",
        startTime: "",
        endTime: "",
        guestCount: undefined,
        notes: "",
      });
      setTab("my-bookings");
      await reload();
    }, [partyForm, reload]),
    {
      successMessage: "Party room booking submitted for review.",
      errorMessage: "Unable to submit booking.",
      onError: (message) => setPageError(message),
    }
  );

  const { run: runPay, loading: paying } = useAsyncAction(
    useCallback(async () => {
      await residentRepo.acceptPartyRoomPayment(actionBookingIdRef.current);
      await reload();
    }, [reload]),
    {
      successMessage: "Payment recorded. Your party room booking is confirmed.",
      errorMessage: "Payment failed.",
      onError: (message) => setPageError(message),
    }
  );

  const { run: runCancel, loading: cancelling } = useAsyncAction(
    useCallback(async () => {
      await residentRepo.cancelAmenityBooking(actionBookingIdRef.current);
      await reload();
    }, [reload]),
    {
      successMessage: "Booking cancelled.",
      errorMessage: "Unable to cancel booking.",
      onError: (message) => setPageError(message),
    }
  );

  const actionId = paying || cancelling ? actionBookingIdRef.current : null;

  const handleSubmitElevator = async (event: React.FormEvent) => {
    event.preventDefault();
    clearPageError();
    await submitElevator();
  };

  const handleSubmitPartyRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    clearPageError();
    await submitPartyRoom();
  };

  const handlePay = async (bookingId: string) => {
    clearPageError();
    actionBookingIdRef.current = bookingId;
    await runPay();
  };

  const handleCancel = async (bookingId: string) => {
    clearPageError();
    actionBookingIdRef.current = bookingId;
    await runCancel();
  };

  const handleMarkRead = async (booking: AmenityBooking) => {
    if (!booking.unread) return;
    await residentRepo.markAmenityBookingRead(booking.id);
    await reload();
  };

  return (
    <CrudPanel className="space-y-4" loading={pageLoading}>
      <ModuleMessageBanner moduleId="amenityBookings" />

      <div className="flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => handleTabChange(entry.id)}
            className={`rounded px-3 py-1.5 text-xs font-medium ${
              tab === entry.id
                ? "bg-[#2e3f4f] text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {error ? <FormAlert message={error} /> : null}

      {tab === "elevator" ? (
        <div className="rounded-sm bg-white/95 p-4 shadow-lg">
          {settings.elevatorInstructions ? (
            <p className="mb-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {settings.elevatorInstructions}
            </p>
          ) : null}
          {elevators.length === 0 ? (
            <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              No elevators are configured for this building. Contact your building administrator to set up bookable
              elevators under Building Definition → Amenities.
            </p>
          ) : (
            <form onSubmit={handleSubmitElevator} className="grid max-w-xl gap-3">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Elevator</span>
                <select
                  required
                  value={elevatorForm.amenityResourceId}
                  onChange={(event) =>
                    setElevatorForm((prev) => ({ ...prev, amenityResourceId: event.target.value }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-black"
                >
                  <option value="">Select an elevator…</option>
                  {elevators.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                      {resource.locationLabel ? ` (${resource.locationLabel})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Date</span>
              <input
                type="date"
                required
                value={elevatorForm.bookingDate}
                onChange={(event) =>
                  setElevatorForm((prev) => ({ ...prev, bookingDate: event.target.value }))
                }
                className="w-full rounded border border-slate-300 px-3 py-2 text-black"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Start time</span>
                <input
                  type="time"
                  required
                  value={elevatorForm.startTime}
                  onChange={(event) =>
                    setElevatorForm((prev) => ({ ...prev, startTime: event.target.value }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-black"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">End time</span>
                <input
                  type="time"
                  required
                  value={elevatorForm.endTime}
                  onChange={(event) =>
                    setElevatorForm((prev) => ({ ...prev, endTime: event.target.value }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-black"
                />
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Notes</span>
              <textarea
                value={elevatorForm.notes ?? ""}
                onChange={(event) => setElevatorForm((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                className="w-full rounded border border-slate-300 px-3 py-2 text-black"
                placeholder="Moving details, number of trips, etc."
              />
            </label>
            <ActionButton
              type="submit"
              label="Submit Elevator Booking"
              loadingLabel="Submitting…"
              loading={submittingElevator}
              disabled={elevators.length === 0}
              className="w-fit"
            />
          </form>
          )}
        </div>
      ) : null}

      {tab === "party-room" ? (
        <div className="rounded-sm bg-white/95 p-4 shadow-lg">
          {settings.partyRoomInstructions ? (
            <p className="mb-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {settings.partyRoomInstructions}
            </p>
          ) : null}
          {settings.partyRoomFee ? (
            <p className="mb-4 text-sm text-slate-600">
              Typical party room fee: <strong>{settings.partyRoomFee}</strong> (final amount confirmed by admin)
            </p>
          ) : null}
          {partyRooms.length === 0 ? (
            <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              No party rooms are configured for this building. Contact your building administrator to set up bookable
              party rooms under Building Definition → Amenities.
            </p>
          ) : (
            <form onSubmit={handleSubmitPartyRoom} className="grid max-w-xl gap-3">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Party room</span>
                <select
                  required
                  value={partyForm.amenityResourceId}
                  onChange={(event) =>
                    setPartyForm((prev) => ({ ...prev, amenityResourceId: event.target.value }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-black"
                >
                  <option value="">Select a party room…</option>
                  {partyRooms.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                      {resource.locationLabel ? ` (${resource.locationLabel})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Date</span>
              <input
                type="date"
                required
                value={partyForm.bookingDate}
                onChange={(event) =>
                  setPartyForm((prev) => ({ ...prev, bookingDate: event.target.value }))
                }
                className="w-full rounded border border-slate-300 px-3 py-2 text-black"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Start time</span>
                <input
                  type="time"
                  required
                  value={partyForm.startTime}
                  onChange={(event) =>
                    setPartyForm((prev) => ({ ...prev, startTime: event.target.value }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-black"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">End time</span>
                <input
                  type="time"
                  required
                  value={partyForm.endTime}
                  onChange={(event) =>
                    setPartyForm((prev) => ({ ...prev, endTime: event.target.value }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-black"
                />
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Guest count (optional)</span>
              <input
                type="number"
                min={1}
                value={partyForm.guestCount ?? ""}
                onChange={(event) =>
                  setPartyForm((prev) => ({
                    ...prev,
                    guestCount: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
                className="w-full rounded border border-slate-300 px-3 py-2 text-black"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Notes</span>
              <textarea
                value={partyForm.notes ?? ""}
                onChange={(event) => setPartyForm((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                className="w-full rounded border border-slate-300 px-3 py-2 text-black"
              />
            </label>
            <ActionButton
              type="submit"
              label="Submit Party Room Booking"
              loadingLabel="Submitting…"
              loading={submittingPartyRoom}
              disabled={partyRooms.length === 0}
              className="w-fit"
            />
          </form>
          )}
        </div>
      ) : null}

      {tab === "my-bookings" ? (
        <div className="rounded-sm bg-white/95 p-4 shadow-lg">
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-500">You have no amenity bookings yet.</p>
          ) : (
            <ul className="space-y-3">
              {bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="rounded border border-slate-200 px-3 py-3"
                  onMouseEnter={() => void handleMarkRead(booking)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-800">
                        {labelType(booking.bookingType)}
                        {booking.amenityResourceName ? (
                          <span className="font-normal text-slate-600"> · {booking.amenityResourceName}</span>
                        ) : null}
                        {booking.unread ? (
                          <span className="ml-2 rounded bg-[#3476ef] px-1.5 py-0.5 text-[10px] text-white">
                            New
                          </span>
                        ) : null}
                      </p>
                      <p className="text-sm text-slate-600">
                        {booking.bookingDate} · {booking.startTime}–{booking.endTime}
                      </p>
                      {booking.adminNotes ? (
                        <p className="mt-1 text-sm text-slate-500">{booking.adminNotes}</p>
                      ) : null}
                    </div>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusClass(booking.status)}`}>
                      {labelStatus(booking.status)}
                    </span>
                  </div>
                  {booking.paymentAmount && booking.status === "approvedAwaitingPayment" ? (
                    <p className="mt-2 text-sm text-slate-700">Amount due: {booking.paymentAmount}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {booking.status === "approvedAwaitingPayment" ? (
                      <ActionButton
                        label="Accept & Pay"
                        loadingLabel="Processing…"
                        loading={paying && actionId === booking.id}
                        disabled={paying || cancelling}
                        className="px-3 py-1.5 text-xs"
                        onClick={() => void handlePay(booking.id)}
                      />
                    ) : null}
                    {booking.status === "pending" ? (
                      <ActionButton
                        label="Cancel"
                        variant="secondary"
                        loading={cancelling && actionId === booking.id}
                        disabled={paying || cancelling}
                        className="px-3 py-1.5 text-xs"
                        onClick={() => void handleCancel(booking.id)}
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </CrudPanel>
  );
}
