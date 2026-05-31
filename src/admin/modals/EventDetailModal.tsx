import { Modal } from "../../shared/Modal";
import { StatusBadge } from "../components/AdminBadges";
import type { CalendarEvent } from "../../resident/data/types";

type EventDetailModalProps = {
  event: CalendarEvent | null;
  onClose: () => void;
};

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  if (!event) return null;

  const displayDate = formatDisplayDate(event.date);

  return (
    <Modal
      open={!!event}
      onClose={onClose}
      title={event.title}
      size="lg"
      footer={
        <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">
          Close
        </button>
      }
    >
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <dt className="font-medium text-slate-600">Status</dt>
        <dd>
          <StatusBadge status={event.status ?? "Active"} />
        </dd>
        <dt className="font-medium text-slate-600">Date</dt>
        <dd>{displayDate}</dd>
        {event.created && (
          <>
            <dt className="font-medium text-slate-600">Created</dt>
            <dd>{event.created}</dd>
          </>
        )}
        {event.location && (
          <>
            <dt className="font-medium text-slate-600">Location</dt>
            <dd>{event.location}</dd>
          </>
        )}
        <dt className="font-medium text-slate-600">Show To</dt>
        <dd>{event.showTo ?? "All Residents"}</dd>
        {event.occurrence && (
          <>
            <dt className="font-medium text-slate-600">Occurrence</dt>
            <dd>{event.occurrence}</dd>
          </>
        )}
        {event.day && (
          <>
            <dt className="font-medium text-slate-600">Day</dt>
            <dd>{event.day}</dd>
          </>
        )}
        {event.description && (
          <>
            <dt className="col-span-2 font-medium text-slate-600">Description</dt>
            <dd className="col-span-2 whitespace-pre-wrap text-slate-700">{event.description}</dd>
          </>
        )}
      </dl>
    </Modal>
  );
}

function formatDisplayDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}-${y}`;
}
