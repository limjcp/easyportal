import { useCallback, useEffect, useRef, useState } from "react";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { AdminPageActions } from "../components/AdminPageActions";
import { AdminPanelHeader } from "../components/AdminPanelTable";
import { StatusBadge } from "../components/AdminBadges";
import { adminRepository } from "../data/adminRepository";
import type { AdminRoute } from "../navigation";
import type { AgmMeeting } from "../../resident/data/types";
import { Modal } from "../../shared/Modal";

type AgmMeetingsPageProps = {
  route: AdminRoute & { page: "agm" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

type AddAgmModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { title: string; scheduledDate: string; location: string; notes?: string }) => Promise<void>;
};

function AddAgmModal({ open, onClose, onCreate }: AddAgmModalProps) {
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const { run: submit, loading, error } = useAsyncAction(
    useCallback(async () => {
      if (!title.trim() || !scheduledDate || !location.trim()) {
        alert("Title, date, and location are required.");
        return;
      }
      await onCreate({
        title: title.trim(),
        scheduledDate,
        location: location.trim(),
        notes: notes.trim() || undefined,
      });
      setTitle("");
      setScheduledDate("");
      setLocation("");
      setNotes("");
      onClose();
    }, [title, scheduledDate, location, notes, onCreate, onClose]),
    { successMessage: "AGM meeting created.", showErrorToast: false }
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create AGM Meeting"
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600"
          >
            Cancel
          </button>
          <ActionButton label="Create" loadingLabel="Creating…" loading={loading} onClick={() => void submit()} />
        </>
      }
    >
      {error ? <FormAlert message={error} className="mb-3" /> : null}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          AGM Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Scheduled Date
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Location
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
      </div>
    </Modal>
  );
}

export function AgmMeetingsPage({ route, onNavigate, refreshKey, onRefresh }: AgmMeetingsPageProps) {
  const [items, setItems] = useState<AgmMeeting[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const pendingMeetingIdRef = useRef<string | null>(null);
  const pendingCreateRef = useRef<{ title: string; scheduledDate: string; location: string; notes?: string } | null>(null);

  useEffect(() => {
    adminRepository.getAgmMeetings().then(setItems);
  }, [refreshKey]);

  const { run: startMeetingRun, error: startError } = useAsyncAction(
    useCallback(async () => {
      const meetingId = pendingMeetingIdRef.current;
      if (!meetingId) return;
      await adminRepository.startAgmMeeting(meetingId);
      onRefresh();
    }, [onRefresh]),
    { successMessage: "AGM started." }
  );

  const { run: endMeetingRun, error: endError } = useAsyncAction(
    useCallback(async () => {
      const meetingId = pendingMeetingIdRef.current;
      if (!meetingId) return;
      await adminRepository.endAgmMeeting(meetingId);
      onRefresh();
    }, [onRefresh]),
    { successMessage: "AGM ended." }
  );

  const { run: createMeetingRun } = useAsyncAction(
    useCallback(async () => {
      const input = pendingCreateRef.current;
      if (!input) return;
      await adminRepository.createAgmMeeting(input);
      onRefresh();
    }, [onRefresh]),
    { showSuccessToast: false }
  );

  const actionError = startError ?? endError;

  const startMeeting = (meetingId: string) => {
    pendingMeetingIdRef.current = meetingId;
    void startMeetingRun();
  };

  const endMeeting = (meetingId: string) => {
    pendingMeetingIdRef.current = meetingId;
    void endMeetingRun();
  };

  return (
    <>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white hover:bg-[#2d68cf]"
          >
            + Start Owner Meeting Setup
          </button>
        }
      />

      {actionError ? <FormAlert message={actionError} className="mb-3" /> : null}

      <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
        <AdminPanelHeader title="AGM Meetings" />
        <div className="divide-y divide-slate-200">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No AGM meetings yet. Create one to start preparing polls.
            </div>
          ) : (
            items.map((meeting) => (
              <div key={meeting.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{meeting.title}</h3>
                    <StatusBadge status={meeting.status} />
                  </div>
                  <p className="text-sm text-slate-600">
                    {meeting.scheduledDate} - {meeting.location}
                  </p>
                  {meeting.notes && <p className="mt-1 text-xs text-slate-500">{meeting.notes}</p>}
                  {meeting.startedAt && (
                    <p className="text-xs text-slate-500">Started: {new Date(meeting.startedAt).toLocaleString()}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {meeting.status !== "active" && meeting.status !== "ended" && (
                    <ActionButton
                      label="Start AGM"
                      variant="success"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => startMeeting(meeting.id)}
                    />
                  )}
                  {meeting.status === "active" && (
                    <ActionButton
                      label="End AGM"
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => endMeeting(meeting.id)}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddAgmModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={async (input) => {
          pendingCreateRef.current = input;
          await createMeetingRun();
        }}
      />
    </>
  );
}
