import { useEffect, useState } from "react";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { residentRepo } from "../data/mockRepository";
import type {
  AmenityBooking,
  BuildingAmenitySettings,
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
  const [tab, setTab] = useState<TabId>("elevator");
  const [settings, setSettings] = useState<BuildingAmenitySettings>({
    partyRoomFee: "",
    elevatorInstructions: "",
    partyRoomInstructions: "",
  });
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [elevatorForm, setElevatorForm] = useState<SubmitElevatorBookingInput>({
    bookingDate: "",
    startTime: "",
    endTime: "",
    notes: "",
  });
  const [partyForm, setPartyForm] = useState<SubmitPartyRoomBookingInput>({
    bookingDate: "",
    startTime: "",
    endTime: "",
    guestCount: undefined,
    notes: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const reload = async () => {
    const [loadedSettings, loadedBookings] = await Promise.all([
      residentRepo.getBuildingAmenitySettings(),
      residentRepo.getAmenityBookings(),
    ]);
    setSettings(loadedSettings);
    setBookings(loadedBookings);
  };

  useEffect(() => {
    void reload();
  }, [refreshKey]);

  const handleSubmitElevator = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await residentRepo.submitElevatorBooking(elevatorForm);
      setElevatorForm({ bookingDate: "", startTime: "", endTime: "", notes: "" });
      setMessage("Elevator booking submitted for review.");
      setTab("my-bookings");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPartyRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await residentRepo.submitPartyRoomBooking(partyForm);
      setPartyForm({ bookingDate: "", startTime: "", endTime: "", guestCount: undefined, notes: "" });
      setMessage("Party room booking submitted for review.");
      setTab("my-bookings");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async (bookingId: string) => {
    setActionId(bookingId);
    setError(null);
    setMessage(null);
    try {
      await residentRepo.acceptPartyRoomPayment(bookingId);
      setMessage("Payment recorded. Your party room booking is confirmed.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    setActionId(bookingId);
    setError(null);
    try {
      await residentRepo.cancelAmenityBooking(bookingId);
      setMessage("Booking cancelled.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel booking.");
    } finally {
      setActionId(null);
    }
  };

  const handleMarkRead = async (booking: AmenityBooking) => {
    if (!booking.unread) return;
    await residentRepo.markAmenityBookingRead(booking.id);
    await reload();
  };

  return (
    <div className="space-y-4">
      <ModuleMessageBanner moduleId="amenityBookings" />

      <div className="flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => {
              setTab(entry.id);
              setError(null);
              setMessage(null);
            }}
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

      {message ? (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {tab === "elevator" ? (
        <div className="rounded-sm bg-white/95 p-4 shadow-lg">
          {settings.elevatorInstructions ? (
            <p className="mb-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {settings.elevatorInstructions}
            </p>
          ) : null}
          <form onSubmit={handleSubmitElevator} className="grid max-w-xl gap-3">
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
            <button
              type="submit"
              disabled={submitting}
              className="w-fit rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Submit Elevator Booking
            </button>
          </form>
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
          <form onSubmit={handleSubmitPartyRoom} className="grid max-w-xl gap-3">
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
            <button
              type="submit"
              disabled={submitting}
              className="w-fit rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Submit Party Room Booking
            </button>
          </form>
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
                      <button
                        type="button"
                        disabled={actionId === booking.id}
                        onClick={() => void handlePay(booking.id)}
                        className="rounded bg-[#3476ef] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      >
                        {actionId === booking.id ? "Processing…" : "Accept & Pay"}
                      </button>
                    ) : null}
                    {booking.status === "pending" ? (
                      <button
                        type="button"
                        disabled={actionId === booking.id}
                        onClick={() => void handleCancel(booking.id)}
                        className="rounded border border-slate-300 px-3 py-1.5 text-xs disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
