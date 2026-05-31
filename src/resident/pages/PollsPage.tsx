import { useEffect, useState } from "react";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { residentRepo } from "../data/mockRepository";
import type { AgmMeeting, Poll, PollAttachment } from "../data/types";

function PollAttachmentViewer({ attachment }: { attachment: PollAttachment }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3">
      <p className="mb-2 text-sm font-medium text-slate-700">{attachment.name}</p>
      {attachment.kind === "image" ? (
        <img
          src={attachment.sourceUrl}
          alt={attachment.name}
          className="max-h-[26rem] w-full rounded border border-slate-200 object-contain"
        />
      ) : (
        <iframe
          src={attachment.sourceUrl}
          title={attachment.name}
          className="h-[28rem] w-full rounded border border-slate-200"
        />
      )}
      <p className="mt-2 text-xs text-slate-500">
        Attachment view is available only inside the portal.
      </p>
    </div>
  );
}

export function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activePollId, setActivePollId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<PollAttachment[]>([]);
  const [agmMeeting, setAgmMeeting] = useState<AgmMeeting | null>(null);

  const activePoll = polls.find((poll) => poll.id === activePollId) ?? null;

  useEffect(() => {
    residentRepo.getPollsForResident().then((items) => {
      setPolls(items);
      setActivePollId((current) => current ?? items[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!activePollId) {
      setAttachments([]);
      return;
    }
    residentRepo.getPollAttachments(activePollId).then(setAttachments);
  }, [activePollId]);

  useEffect(() => {
    if (!activePoll?.agmMeetingId) {
      setAgmMeeting(null);
      return;
    }
    residentRepo.getAgmMeetingById(activePoll.agmMeetingId).then(setAgmMeeting);
  }, [activePoll?.agmMeetingId]);

  if (polls.length === 0) {
    return (
      <div className="space-y-4">
        <ModuleMessageBanner moduleId="polls" />
        <p className="rounded-sm bg-white/95 p-6 text-center text-slate-600 shadow-lg">
          No active polls are available right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ModuleMessageBanner moduleId="polls" />
      <div className="grid gap-4 lg:grid-cols-[18rem,1fr]">
        <aside className="rounded-sm bg-white/95 p-3 shadow-lg">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Polls</h2>
          <div className="space-y-2">
            {polls.map((poll) => (
              <button
                key={poll.id}
                type="button"
                onClick={() => setActivePollId(poll.id)}
                className={`w-full rounded border px-3 py-2 text-left text-sm transition ${
                  poll.id === activePollId
                    ? "border-[#3476ef] bg-blue-50 text-slate-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <p className="font-medium">{poll.title}</p>
                <p className="text-xs text-slate-500">Expires {poll.expiresAt ?? "N/A"}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-sm bg-white/95 p-4 shadow-lg">
          {activePoll ? (
            <div className="space-y-4">
              <header>
                <h1 className="text-xl font-semibold text-slate-800">{activePoll.title}</h1>
                <p className="mt-1 text-xs text-slate-500">
                  Active poll - {activePoll.questions.length} question
                  {activePoll.questions.length === 1 ? "" : "s"}
                </p>
              </header>

              {agmMeeting && (
                <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-700">
                  <p className="font-medium">Linked AGM: {agmMeeting.title}</p>
                  <p>
                    {agmMeeting.scheduledDate} - {agmMeeting.location}
                  </p>
                </div>
              )}

              <section>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
                  Questions
                </h3>
                {activePoll.questions.length === 0 ? (
                  <p className="text-sm text-slate-500">No questions available yet.</p>
                ) : (
                  <ol className="space-y-2 text-sm text-slate-700">
                    {activePoll.questions
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((question) => (
                        <li key={question.id} className="rounded border border-slate-200 px-3 py-2">
                          {question.sortOrder}. {question.question}
                        </li>
                      ))}
                  </ol>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
                  Attachments
                </h3>
                {attachments.length === 0 ? (
                  <p className="text-sm text-slate-500">No attachments for this poll.</p>
                ) : (
                  <div className="space-y-3">
                    {attachments.map((attachment) => (
                      <PollAttachmentViewer key={attachment.id} attachment={attachment} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
