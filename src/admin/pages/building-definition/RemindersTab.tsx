import { useCallback, useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import { Modal } from "../../../shared/Modal";
import { ActionButton } from "../../../shared/ActionButton";
import { FormAlert } from "../../../shared/FormAlert";
import { useAsyncAction } from "../../../shared/useAsyncAction";
import { AdminFormPanel, InfoBanner } from "../../components/AdminFormPanel";
import { adminRepository } from "../../data/adminRepository";
import type { BuildingReminder } from "../../../resident/data/types";

type RemindersTabProps = {
  refreshKey: number;
  onRefresh: () => void;
};

export function RemindersTab({ refreshKey, onRefresh }: RemindersTabProps) {
  const [reminders, setReminders] = useState<BuildingReminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState("");
  const [schedule, setSchedule] = useState("");

  useEffect(() => {
    adminRepository.getBuildingReminders().then(setReminders);
  }, [refreshKey]);

  const { run: handleCreate, loading: creating, error } = useAsyncAction(
    useCallback(async () => {
      if (!title.trim()) {
        throw new Error("Title is required.");
      }
      await adminRepository.createBuildingReminder({
        title: title.trim(),
        body: body.trim(),
        recipients: recipients.trim(),
        schedule: schedule.trim(),
      });
      setShowModal(false);
      setTitle("");
      setBody("");
      setRecipients("");
      setSchedule("");
      onRefresh();
    }, [title, body, recipients, schedule, onRefresh]),
    { successMessage: "Reminder created." }
  );

  return (
    <div className="space-y-4">
      <InfoBanner
        icon={<FaBell />}
        title="Admin Building Reminders"
        subtitle="Create reminders for building administrators."
      />

      {reminders.length === 0 ? (
        <div className="rounded border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500">No reminders configured.</p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-4 rounded bg-[#89c64c] px-4 py-2 text-sm text-white"
          >
            + Add Reminder
          </button>
        </div>
      ) : (
        <AdminFormPanel title="Reminders">
          <ul className="space-y-3">
            {reminders.map((r) => (
              <li key={r.id} className="rounded border border-slate-200 px-4 py-3 text-sm">
                <p className="font-semibold">{r.title}</p>
                <p className="text-slate-600">{r.body}</p>
                <p className="mt-1 text-xs text-slate-500">Schedule: {r.schedule} · To: {r.recipients}</p>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setShowModal(true)} className="mt-4 rounded bg-[#89c64c] px-4 py-2 text-sm text-white">
            + Add Reminder
          </button>
        </AdminFormPanel>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Reminder"
        footer={
          <>
            <button type="button" onClick={() => setShowModal(false)} className="rounded border px-4 py-2 text-sm">Cancel</button>
            <ActionButton label="Create" loadingLabel="Creating…" loading={creating} onClick={() => void handleCreate()} />
          </>
        }
      >
        {error ? <FormAlert message={error} className="mb-3" /> : null}
        <div className="space-y-3">
          <label className="block text-sm">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5" />
          </label>
          <label className="block text-sm">
            Schedule
            <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="e.g. Monthly on the 1st" className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5" />
          </label>
          <label className="block text-sm">
            Recipients
            <input value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="e.g. property@example.com" className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5" />
          </label>
          <label className="block text-sm">
            Body
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5" />
          </label>
        </div>
      </Modal>
    </div>
  );
}
