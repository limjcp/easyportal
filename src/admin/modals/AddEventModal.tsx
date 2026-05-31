import { useEffect, useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import type { AdminEventType, CreateCalendarEventInput } from "../../resident/data/types";

type AddEventModalProps = {
  open: boolean;
  eventType: AdminEventType;
  onClose: () => void;
  onSubmit: (event: CreateCalendarEventInput) => void;
};

export function AddEventModal({ open, eventType, onClose, onSubmit }: AddEventModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [showTo, setShowTo] = useState("All Residents");
  const [status, setStatus] = useState<"Draft" | "Active">("Draft");
  const [adminOnly, setAdminOnly] = useState(false);
  const [occurrence, setOccurrence] = useState("Weekly");
  const [day, setDay] = useState("Monday");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setLocation("");
    setShowTo("All Residents");
    setStatus("Draft");
    setAdminOnly(false);
    setOccurrence("Weekly");
    setDay("Monday");
  }, [open, eventType]);

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("Title is required.");
      return;
    }
    const created = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    onSubmit({
      title: title.trim(),
      date,
      description: description.trim() || undefined,
      eventType,
      status,
      created,
      location: eventType === "once" ? location.trim() || undefined : undefined,
      showTo,
      adminOnly,
      occurrence: eventType !== "once" ? occurrence : undefined,
      day: eventType !== "once" ? day : undefined,
    });
    onClose();
  };

  const typeLabel =
    eventType === "once" ? "One-Time" : eventType === "recurring" ? "Recurring" : "Paid";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add ${typeLabel} Event`}
      icon={<FaCalendarAlt className="text-[#7D5DA7]" />}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded bg-[#7D5DA7] px-4 py-2 text-sm text-white"
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block text-sm">
          Title *
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "Draft" | "Active")}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
            </select>
          </label>
        </div>
        {eventType === "once" && (
          <label className="block text-sm">
            Location
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            />
          </label>
        )}
        {eventType !== "once" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Occurrence
              <select
                value={occurrence}
                onChange={(e) => setOccurrence(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
              >
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Daily</option>
                <option>Per booking</option>
              </select>
            </label>
            <label className="block text-sm">
              Day
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Daily"].map(
                  (d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>
        )}
        <label className="block text-sm">
          Show To
          <select
            value={showTo}
            onChange={(e) => setShowTo(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          >
            <option>All Residents</option>
            <option>Board Only</option>
            <option>Admin Only</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={adminOnly}
            onChange={(e) => setAdminOnly(e.target.checked)}
          />
          Admin-only event (hidden from resident portal)
        </label>
        <label className="block text-sm">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
      </div>
    </Modal>
  );
}
