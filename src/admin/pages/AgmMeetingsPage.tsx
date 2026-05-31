import { useEffect, useState } from "react";
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

  const submit = async () => {
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
  };

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
          <button
            type="button"
            onClick={() => void submit()}
            className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white"
          >
            Create
          </button>
        </>
      }
    >
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

  useEffect(() => {
    adminRepository.getAgmMeetings().then(setItems);
  }, [refreshKey]);

  const startMeeting = async (meetingId: string) => {
    await adminRepository.startAgmMeeting(meetingId);
    onRefresh();
  };

  const endMeeting = async (meetingId: string) => {
    await adminRepository.endAgmMeeting(meetingId);
    onRefresh();
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
                    <button
                      type="button"
                      onClick={() => void startMeeting(meeting.id)}
                      className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Start AGM
                    </button>
                  )}
                  {meeting.status === "active" && (
                    <button
                      type="button"
                      onClick={() => void endMeeting(meeting.id)}
                      className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      End AGM
                    </button>
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
          await adminRepository.createAgmMeeting(input);
          onRefresh();
        }}
      />
    </>
  );
}
