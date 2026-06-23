import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../../shared/Modal";
import { ConfirmModal } from "../../shared/ConfirmModal";
import { ActionButton } from "../../shared/ActionButton";
import { FileUploadZone } from "../../shared/FileUploadZone";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { usePageContentBusy } from "../../shared/usePageContentBusy";
import { inferAttachmentKind, toDataUrl, validateAttachmentFile } from "../../shared/attachmentUtils";
import { AdminPanelHeader } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type { AgmMeeting, Poll, PollAttachment, PollQuestion, PollResults } from "../../resident/data/types";
import {
  formatPollAnswerOptions,
  parsePollAnswerOptions,
  POLL_QUESTION_TYPE_SINGLE,
} from "../../shared/pollUtils";

const RESIDENT_TYPES = [
  "Board Members",
  "Absentee Owner",
  "Owners",
  "Tenants",
  "Occupants",
  "Unit Managers",
];

type PollEditPageProps = {
  route: AdminRoute & { page: "poll-edit" };
  onNavigate: (route: AdminRoute) => void;
};

export function PollEditPage({ route, onNavigate }: PollEditPageProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [meetings, setMeetings] = useState<AgmMeeting[]>([]);
  const [attachments, setAttachments] = useState<PollAttachment[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [removeQuestionOpen, setRemoveQuestionOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswers, setNewAnswers] = useState(["", ""]);
  const [results, setResults] = useState<PollResults | null>(null);

  const loadResults = useCallback(
    () => adminRepository.getPollResults(route.id).then(setResults),
    [route.id]
  );

  const pendingUpdatesRef = useRef<Partial<Poll> | null>(null);
  const pendingQuestionIdRef = useRef<string | null>(null);
  const pendingFileRef = useRef<File | null>(null);
  const pendingAttachmentIdRef = useRef<string | null>(null);

  const { run: updatePoll, error: updateError } = useAsyncAction(
    useCallback(async () => {
      const updates = pendingUpdatesRef.current;
      if (!updates) return;
      const updated = await adminRepository.updatePoll(route.id, updates);
      if (updated) setPoll(updated);
    }, [route.id]),
    { showSuccessToast: false, showErrorToast: false }
  );

  const { run: addQuestion, loading: addingQuestion, error: questionError } = useAsyncAction(
    useCallback(async () => {
      if (!poll) return;
      const questionText = newQuestion.trim();
      const answers = newAnswers.map((answer) => answer.trim()).filter(Boolean);
      if (!questionText) {
        alert("Question text is required.");
        return;
      }
      if (answers.length < 2) {
        alert("Add at least two answer options.");
        return;
      }
      await adminRepository.addPollQuestion(route.id, {
        sortOrder: poll.questions.length + 1,
        question: questionText,
        type: POLL_QUESTION_TYPE_SINGLE,
        answerOptions: formatPollAnswerOptions(answers),
      });
      const refreshed = await adminRepository.getPollById(route.id);
      if (refreshed) setPoll(refreshed);
      setNewQuestion("");
      setNewAnswers(["", ""]);
      void loadResults();
    }, [poll, newQuestion, newAnswers, route.id, loadResults]),
    { successMessage: "Question added.", showErrorToast: false }
  );

  const { run: removeQuestionRun, loading: removingQuestion } = useAsyncAction(
    useCallback(async () => {
      const questionId = pendingQuestionIdRef.current;
      if (!questionId) return;
      await adminRepository.deletePollQuestion(questionId);
      const refreshed = await adminRepository.getPollById(route.id);
      if (refreshed) setPoll(refreshed);
      void loadResults();
      setRemoveQuestionOpen(false);
      pendingQuestionIdRef.current = null;
    }, [route.id, loadResults]),
    { successMessage: "Question removed.", showErrorToast: false }
  );

  const { run: addAttachmentRun, error: attachmentError } = useAsyncAction(
    useCallback(async () => {
      const file = pendingFileRef.current;
      if (!file) return;
      const validationError = validateAttachmentFile(file);
      if (validationError) {
        alert(validationError);
        return;
      }
      const sourceUrl = await toDataUrl(file);
      const kind = inferAttachmentKind(file.type);
      await adminRepository.addPollAttachment(route.id, {
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        kind,
        sourceUrl,
      });
      const refreshed = await adminRepository.getPollAttachments(route.id);
      setAttachments(refreshed);
    }, [route.id]),
    { successMessage: "Attachment added.", showErrorToast: false }
  );

  const { run: removeAttachmentRun } = useAsyncAction(
    useCallback(async () => {
      const attachmentId = pendingAttachmentIdRef.current;
      if (!attachmentId) return;
      await adminRepository.removePollAttachment(attachmentId);
      const refreshed = await adminRepository.getPollAttachments(route.id);
      setAttachments(refreshed);
    }, [route.id]),
    { successMessage: "Attachment removed.", showErrorToast: false }
  );

  const activeMeetingOptions = useMemo(
    () => meetings.filter((meeting) => meeting.status === "draft" || meeting.status === "active"),
    [meetings]
  );

  useEffect(() => {
    adminRepository.getPollById(route.id).then(setPoll);
    adminRepository.getAgmMeetings().then(setMeetings);
    adminRepository.getPollAttachments(route.id).then(setAttachments);
    void loadResults();
  }, [route.id]);

  usePageContentBusy(!poll);

  if (!poll) {
    return null;
  }

  const update = (updates: Partial<Poll>) => {
    pendingUpdatesRef.current = updates;
    void updatePoll();
  };

  const removeQuestion = (questionId: string) => {
    pendingQuestionIdRef.current = questionId;
    setRemoveQuestionOpen(true);
  };

  const addAttachment = (file: File | null) => {
    pendingFileRef.current = file;
    void addAttachmentRun();
  };

  const removeAttachment = (attachmentId: string) => {
    pendingAttachmentIdRef.current = attachmentId;
    void removeAttachmentRun();
  };

  const toggleResidentType = (type: string) => {
    const types = poll.residentTypes.includes(type)
      ? poll.residentTypes.filter((t) => t !== type)
      : [...poll.residentTypes, type];
    update({ residentTypes: types });
  };

  const formError = updateError ?? questionError ?? attachmentError;

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
          {formError ? <FormAlert message={formError} /> : null}
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
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {poll.questions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No data available in table.
                      </td>
                    </tr>
                  ) : (
                    poll.questions.map((question: PollQuestion) => (
                      <tr key={question.id} className="border-b border-slate-100">
                        <td className="px-4 py-2">{question.sortOrder}</td>
                        <td className="px-4 py-2">{question.question}</td>
                        <td className="px-4 py-2">{question.type}</td>
                        <td className="px-4 py-2">
                          {parsePollAnswerOptions(question).join(", ") || "—"}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => void removeQuestion(question.id)}
                            className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-3 rounded border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-slate-700">Add Question</h4>
              <label className="block text-sm">
                Question
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Enter question text..."
                  className="mt-1 block w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <div>
                <p className="text-sm font-medium text-slate-700">Answer options</p>
                <div className="mt-2 space-y-2">
                  {newAnswers.map((answer, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) =>
                          setNewAnswers((prev) =>
                            prev.map((value, i) => (i === index ? e.target.value : value))
                          )
                        }
                        placeholder={`Answer ${index + 1}`}
                        className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm"
                      />
                      {newAnswers.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setNewAnswers((prev) => prev.filter((_, i) => i !== index))
                          }
                          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setNewAnswers((prev) => [...prev, ""])}
                  className="mt-2 text-xs font-medium text-[#3476ef] hover:underline"
                >
                  + Add answer
                </button>
              </div>
              <ActionButton
                label="Add Question"
                loadingLabel="Adding…"
                loading={addingQuestion}
                onClick={() => void addQuestion()}
              />
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-slate-700">Results</h3>
            {poll.privacy === "anonymous" && (
              <p className="mb-3 text-sm text-slate-600">
                Residents cannot see each other&apos;s votes; this admin view includes voter names.
              </p>
            )}
            {!results || results.totalResponses === 0 ? (
              <p className="text-sm text-slate-500">No responses yet.</p>
            ) : (
              <div className="space-y-6">
                <p className="text-sm text-slate-600">
                  {results.totalResponses} response{results.totalResponses === 1 ? "" : "s"} recorded
                </p>
                {results.questions.map((questionResult) => (
                  <div key={questionResult.questionId}>
                    <h4 className="mb-2 font-medium text-slate-800">
                      {questionResult.question}{" "}
                      <span className="text-sm font-normal text-slate-500">
                        ({questionResult.totalResponses} response
                        {questionResult.totalResponses === 1 ? "" : "s"})
                      </span>
                    </h4>
                    {questionResult.options.length === 0 ? (
                      <p className="text-sm text-slate-500">No answer options configured.</p>
                    ) : (
                      <div className="space-y-2">
                        {questionResult.options.map((option) => (
                          <div key={option.label}>
                            <div className="flex justify-between text-sm">
                              <span>{option.label}</span>
                              <span className="text-slate-600">
                                {option.count} vote{option.count !== 1 ? "s" : ""} ({option.percentage}%)
                              </span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded bg-slate-100">
                              <div
                                className="h-full bg-[#3476ef]"
                                style={{ width: `${option.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div>
                  <h4 className="mb-2 font-medium text-slate-800">Who voted</h4>
                  <div className="overflow-x-auto rounded border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50 text-slate-600">
                          <th className="px-4 py-2">Question</th>
                          <th className="px-4 py-2">Voter</th>
                          <th className="px-4 py-2">Unit</th>
                          <th className="px-4 py-2">Answer</th>
                          <th className="px-4 py-2">Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.voters.map((voter) => (
                          <tr key={voter.responseId} className="border-b border-slate-100">
                            <td className="px-4 py-2">{voter.question}</td>
                            <td className="px-4 py-2">{voter.voterName}</td>
                            <td className="px-4 py-2">{voter.unitLabel}</td>
                            <td className="px-4 py-2">{voter.selectedOption}</td>
                            <td className="px-4 py-2">{voter.submittedAt.slice(0, 16).replace("T", " ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
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
            poll.questions.map((question) => {
              const options = parsePollAnswerOptions(question);
              return (
                <div key={question.id}>
                  <p className="font-medium">{question.question}</p>
                  {options.length === 0 ? (
                    <p className="mt-1 text-slate-500">No answer choices configured.</p>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {options.map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-2 rounded border border-slate-200 px-2 py-1.5"
                        >
                          <input type="radio" disabled name={`preview-${question.id}`} />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>

      <ConfirmModal
        open={removeQuestionOpen}
        onClose={() => {
          if (removingQuestion) return;
          setRemoveQuestionOpen(false);
          pendingQuestionIdRef.current = null;
        }}
        title="Remove Question"
        message="Remove this question?"
        variant="danger"
        loading={removingQuestion}
        onConfirm={() => void removeQuestionRun()}
      />
    </>
  );
}
