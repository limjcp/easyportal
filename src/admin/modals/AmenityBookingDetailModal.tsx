import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { useBusyWhile } from "../../shared/useBusyWhile";
import { adminRepository } from "../data/adminRepository";
import type { AmenityBooking } from "../../resident/data/types";

type AmenityBookingDetailModalProps = {
  bookingId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (updated: AmenityBooking) => void;
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
  const pendingActionRef = useRef<(() => Promise<unknown>) | null>(null);

  const { run: executeAction, loading: saving, error, clearError } = useAsyncAction(
    useCallback(async () => {
      const action = pendingActionRef.current;
      if (!action || !bookingId) return;
      await action();
      const updated = await adminRepository.getAmenityBookingById(bookingId);
      if (updated) onUpdated(updated);
      onClose();
    }, [bookingId, onUpdated, onClose]),
    { showSuccessToast: false }
  );

  const queueAction = (action: () => Promise<unknown>) => {
    pendingActionRef.current = action;
    clearError();
    void executeAction();
  };

  useEffect(() => {
    if (!open || !bookingId) {
      setBooking(null);
      return;
    }
    clearError();
    adminRepository.getAmenityBookingById(bookingId).then((detail) => {
      setBooking(detail);
      setAdminNotes(detail?.adminNotes ?? "");
      setPaymentAmount(detail?.paymentAmount ?? defaultPartyRoomFee);
    });
  }, [open, bookingId, defaultPartyRoomFee, clearError]);

  useBusyWhile(open && !!bookingId && !booking);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={booking ? `${labelType(booking.bookingType)} Booking` : "Booking Details"}
      size="md"
    >
      {booking ? (
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
          <div>
            <p className="text-xs uppercase text-slate-500">Resource</p>
            <p>
              {booking.amenityResourceName ?? "Unassigned"}
              {booking.amenityResourceLocation ? ` (${booking.amenityResourceLocation})` : ""}
            </p>
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

        {error ? <FormAlert message={error} /> : null}

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
              <ActionButton
                label="Decline"
                loading={saving}
                variant="danger"
                onClick={() => queueAction(() => adminRepository.declineAmenityBooking(booking.id, adminNotes))}
              />
              <ActionButton
                label="Confirm"
                loading={saving}
                variant="success"
                onClick={() => queueAction(() => adminRepository.approveElevatorBooking(booking.id, adminNotes))}
              />
            </>
          ) : null}
          {booking.status === "pending" && booking.bookingType === "party_room" ? (
            <>
              <ActionButton
                label="Decline"
                loading={saving}
                variant="danger"
                onClick={() => queueAction(() => adminRepository.declineAmenityBooking(booking.id, adminNotes))}
              />
              <ActionButton
                label="Approve & Set Fee"
                loading={saving}
                variant="success"
                onClick={() =>
                  queueAction(() =>
                    adminRepository.approvePartyRoomBooking(booking.id, paymentAmount, adminNotes)
                  )
                }
              />
            </>
          ) : null}
          {booking.status !== "cancelled" && booking.status !== "declined" && booking.status !== "pending" ? (
            <ActionButton
              label="Cancel Booking"
              loading={saving}
              variant="secondary"
              onClick={() => queueAction(() => adminRepository.cancelAmenityBookingAdmin(booking.id, adminNotes))}
            />
          ) : null}
        </div>
      </div>
      ) : null}
    </Modal>
  );
}
