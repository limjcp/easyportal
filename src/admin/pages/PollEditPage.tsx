import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../shared/Modal";
import { FileUploadZone } from "../../shared/FileUploadZone";
import { AdminPanelHeader } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type { AgmMeeting, Poll, PollAttachment, PollQuestion } from "../../resident/data/types";

const RESIDENT_TYPES = [
  "Board Members",
  "Absentee Owner",
  "Owners",
  "Tenants",
  "Occupants",
  "Unit Managers",
];

const ALLOWED_MIME_PREFIXES = ["image/"];
const ALLOWED_EXACT_MIME = ["application/pdf"];

type PollEditPageProps = {
  route: AdminRoute & { page: "poll-edit" };
  onNavigate: (route: AdminRoute) => void;
};

function canAttachFile(file: File): boolean {
  if (ALLOWED_EXACT_MIME.includes(file.type)) return true;
  return ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix));
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read attachment."));
    reader.readAsDataURL(file);
  });
}

export function PollEditPage({ route, onNavigate }: PollEditPageProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [meetings, setMeetings] = useState<AgmMeeting[]>([]);
  const [attachments, setAttachments] = useState<PollAttachment[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");

  const activeMeetingOptions = useMemo(
    () => meetings.filter((meeting) => meeting.status === "draft" || meeting.status === "active"),
    [meetings]
  );

  useEffect(() => {
    adminRepository.getPollById(route.id).then(setPoll);
    adminRepository.getAgmMeetings().then(setMeetings);
    adminRepository.getPollAttachments(route.id).then(setAttachments);
  }, [route.id]);

  if (!poll) {
    return <div className="py-8 text-center text-slate-500">Loading...</div>;
  }

  const update = async (updates: Partial<Poll>) => {
    const updated = await adminRepository.updatePoll(route.id, updates);
    if (updated) setPoll(updated);
  };

  const toggleResidentType = (type: string) => {
    const types = poll.residentTypes.includes(type)
      ? poll.residentTypes.filter((t) => t !== type)
      : [...poll.residentTypes, type];
    update({ residentTypes: types });
  };

  const addQuestion = async () => {
    if (!newQuestion.trim()) return;
    await adminRepository.addPollQuestion(route.id, {
      sortOrder: poll.questions.length + 1,
      question: newQuestion.trim(),
      type: "Text",
      answerOptions: "",
    });
    const refreshed = await adminRepository.getPollById(route.id);
    if (refreshed) setPoll(refreshed);
    setNewQuestion("");
  };

  const addAttachment = async (file: File | null) => {
    if (!file) return;
    if (!canAttachFile(file)) {
      alert("Only PDF and image attachments are supported.");
      return;
    }
    const sourceUrl = await toDataUrl(file);
    const kind = file.type === "application/pdf" ? "pdf" : "image";
    await adminRepository.addPollAttachment(route.id, {
      name: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      kind,
      sourceUrl,
    });
    const refreshed = await adminRepository.getPollAttachments(route.id);
    setAttachments(refreshed);
  };

  const removeAttachment = async (attachmentId: string) => {
    await adminRepository.removePollAttachment(attachmentId);
    const refreshed = await adminRepository.getPollAttachments(route.id);
    setAttachments(refreshed);
  };

  return (
    <>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="rounded bg-[#3476ef] px-4 py-1.5 text-sm text-white"
          >
            Preview
          </button>
        }
      />

      <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
        <AdminPanelHeader title={`Edit Poll: ${poll.title}`} />

        <div className="space-y-6 p-4">
          <section>
            <h3 className="mb-3 font-semibold text-slate-700">Poll Options</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset>
                <legend className="text-sm font-medium text-slate-600">Status</legend>
                <div className="mt-1 flex gap-4">
                  {(["active", "draft"] as const).map((statusValue) => (
                    <label key={statusValue} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={poll.status === statusValue}
                        onChange={() => update({ status: statusValue })}
                      />
                      {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="text-sm">
                Poll Expiration Date
                <input
                  type="date"
                  value={poll.expiresAt ?? ""}
                  onChange={(e) => update({ expiresAt: e.target.value })}
                  className="mt-1 block w-full rounded border border-slate-300 px-3 py-1.5"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={poll.noNotifications}
                  onChange={(e) => update({ noNotifications: e.target.checked })}
                />
                No Notifications
              </label>
              <fieldset>
                <legend className="text-sm font-medium text-slate-600">Privacy</legend>
                <div className="mt-1 flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={poll.privacy === "anonymous"}
                      onChange={() => update({ privacy: "anonymous" })}
                    />
                    Anonymous
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={poll.privacy === "not-anonymous"}
                      onChange={() => update({ privacy: "not-anonymous" })}
                    />
                    Not Anonymous
                  </label>
                </div>
              </fieldset>
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-slate-700">Tie Poll To AGM</h3>
            <label className="text-sm font-medium text-slate-700">
              AGM Meeting
              <select
                value={poll.agmMeetingId ?? ""}
                onChange={(e) => update({ agmMeetingId: e.target.value || undefined })}
                className="mt-1 block w-full max-w-xl rounded border border-slate-300 px-3 py-1.5"
              >
                <option value="">No AGM linked</option>
                {activeMeetingOptions.map((meeting) => (
                  <option key={meeting.id} value={meeting.id}>
                    {meeting.title} ({meeting.scheduledDate}) - {meeting.status}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-slate-700">Show to the following Resident Types</h3>
            <div className="mb-2 flex gap-3 text-xs text-[#3476ef]">
              <button type="button" onClick={() => update({ residentTypes: [...RESIDENT_TYPES] })}>
                Select All
              </button>
              <button type="button" onClick={() => update({ residentTypes: [] })}>
                Select None
              </button>
            </div>
            <div className="flex flex-wrap gap-4">
              {RESIDENT_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={poll.residentTypes.includes(type)}
                    onChange={() => toggleResidentType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </section>

          <section>
            <label className="text-sm font-medium text-slate-700">
              Show to Filter
              <select
                value={poll.showToFilter}
                onChange={(e) => update({ showToFilter: e.target.value })}
                className="mt-1 block w-full max-w-xs rounded border border-slate-300 px-3 py-1.5"
              >
                <option>No filter</option>
                <option>By floor</option>
                <option>By unit type</option>
              </select>
            </label>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-slate-700">Poll Attachments (PDF / Image)</h3>
            <div className="max-w-xl">
              <FileUploadZone onFileSelect={(file) => void addAttachment(file)} />
            </div>
            {attachments.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No attachments uploaded.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="rounded border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{attachment.name}</p>
                        <p className="text-xs text-slate-500">
                          {attachment.kind.toUpperCase()} - {(attachment.sizeBytes / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeAttachment(attachment.id)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600"
                      >
                        Remove
                      </button>
                    </div>
                    {attachment.kind === "image" ? (
                      <img
                        src={attachment.sourceUrl}
                        alt={attachment.name}
                        className="max-h-48 rounded border border-slate-200"
                      />
                    ) : (
                      <iframe
                        src={attachment.sourceUrl}
                        title={attachment.name}
                        className="h-56 w-full rounded border border-slate-200"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-slate-700">Questions</h3>
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-600">
                    <th className="px-4 py-2">Sort</th>
                    <th className="px-4 py-2">Question</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Answer Options</th>
                  </tr>
                </thead>
                <tbody>
                  {poll.questions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No data available in table.
                      </td>
                    </tr>
                  ) : (
                    poll.questions.map((question: PollQuestion) => (
                      <tr key={question.id} className="border-b border-slate-100">
                        <td className="px-4 py-2">{question.sortOrder}</td>
                        <td className="px-4 py-2">{question.question}</td>
                        <td className="px-4 py-2">{question.type}</td>
                        <td className="px-4 py-2">{question.answerOptions}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="New question..."
                className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => void addQuestion()}
                className="rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white"
              >
                Add Question
              </button>
            </div>
          </section>
        </div>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Preview: ${poll.title}`}
        footer={
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="rounded border border-slate-300 px-4 py-2 text-sm"
          >
            Close
          </button>
        }
      >
        <div className="space-y-4 text-sm">
          {poll.questions.length === 0 ? (
            <p className="text-slate-500">No questions added yet.</p>
          ) : (
            poll.questions.map((question) => (
              <div key={question.id}>
                <p className="font-medium">{question.question}</p>
                <input type="text" disabled className="mt-1 w-full rounded border px-2 py-1" />
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}
