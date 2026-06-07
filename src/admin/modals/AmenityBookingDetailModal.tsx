import { useEffect, useState } from "react";
import { Modal } from "../../shared/Modal";
import { adminRepository } from "../data/adminRepository";
import type { AmenityBooking } from "../../resident/data/types";

type AmenityBookingDetailModalProps = {
  bookingId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  defaultPartyRoomFee?: string;
};

function labelType(type: AmenityBooking["bookingType"]) {
  return type === "elevator" ? "Elevator" : "Party Room";
}

function labelStatus(status: AmenityBooking["status"]) {
  switch (status) {
    case "pending":
      return "Pending";
    case "approvedAwaitingPayment":
      return "Awaiting Payment";
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

export function AmenityBookingDetailModal({
  bookingId,
  open,
  onClose,
  onUpdated,
  defaultPartyRoomFee = "",
}: AmenityBookingDetailModalProps) {
  const [booking, setBooking] = useState<AmenityBooking | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !bookingId) {
      setBooking(null);
      return;
    }
    setError(null);
    adminRepository.getAmenityBookingById(bookingId).then((detail) => {
      setBooking(detail);
      setAdminNotes(detail?.adminNotes ?? "");
      setPaymentAmount(detail?.paymentAmount ?? defaultPartyRoomFee);
    });
  }, [open, bookingId, defaultPartyRoomFee]);

  const runAction = async (action: () => Promise<unknown>) => {
    setSaving(true);
    setError(null);
    try {
      await action();
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setSaving(false);
    }
  };

  if (!booking) {
    return (
      <Modal open={open} onClose={onClose} title="Booking Details" size="md">
        <p className="text-sm text-slate-500">{open ? "Loading…" : ""}</p>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={`${labelType(booking.bookingType)} Booking`} size="md">
      <div className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-slate-500">Resident</p>
            <p className="font-medium text-slate-800">{booking.residentName}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Unit</p>
            <p className="font-medium text-slate-800">{booking.unit}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Date</p>
            <p>{booking.bookingDate}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Time</p>
            <p>
              {booking.startTime} – {booking.endTime}
            </p>
          </div>
          {booking.guestCount != null ? (
            <div>
              <p className="text-xs uppercase text-slate-500">Guests</p>
              <p>{booking.guestCount}</p>
            </div>
          ) : null}
          <div>
            <p className="text-xs uppercase text-slate-500">Status</p>
            <p>{labelStatus(booking.status)}</p>
          </div>
        </div>

        {booking.notes ? (
          <div>
            <p className="text-xs uppercase text-slate-500">Resident Notes</p>
            <p className="whitespace-pre-wrap text-slate-700">{booking.notes}</p>
          </div>
        ) : null}

        {booking.paymentAmount ? (
          <div>
            <p className="text-xs uppercase text-slate-500">Payment Amount</p>
            <p>{booking.paymentAmount}</p>
          </div>
        ) : null}

        {booking.status === "pending" ? (
          <>
            <label className="block space-y-1">
              <span className="text-xs uppercase text-slate-500">Admin Notes</span>
              <textarea
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
                rows={3}
                className="w-full rounded border border-slate-300 px-2 py-2"
              />
            </label>
            {booking.bookingType === "party_room" ? (
              <label className="block space-y-1">
                <span className="text-xs uppercase text-slate-500">Party Room Fee</span>
                <input
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-2"
                  placeholder="$150.00"
                />
              </label>
            ) : null}
          </>
        ) : booking.adminNotes ? (
          <div>
            <p className="text-xs uppercase text-slate-500">Admin Notes</p>
            <p className="whitespace-pre-wrap text-slate-700">{booking.adminNotes}</p>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            Close
          </button>
          {booking.status === "pending" && booking.bookingType === "elevator" ? (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  runAction(() => adminRepository.declineAmenityBooking(booking.id, adminNotes))
                }
                className="rounded bg-[#d9534f] px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Decline
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  runAction(() => adminRepository.approveElevatorBooking(booking.id, adminNotes))
                }
                className="rounded bg-[#5cb85c] px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Confirm
              </button>
            </>
          ) : null}
          {booking.status === "pending" && booking.bookingType === "party_room" ? (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  runAction(() => adminRepository.declineAmenityBooking(booking.id, adminNotes))
                }
                className="rounded bg-[#d9534f] px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Decline
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  runAction(() =>
                    adminRepository.approvePartyRoomBooking(booking.id, paymentAmount, adminNotes)
                  )
                }
                className="rounded bg-[#5cb85c] px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Approve &amp; Set Fee
              </button>
            </>
          ) : null}
          {booking.status !== "cancelled" && booking.status !== "declined" && booking.status !== "pending" ? (
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                runAction(() => adminRepository.cancelAmenityBookingAdmin(booking.id, adminNotes))
              }
              className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
            >
              Cancel Booking
            </button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
