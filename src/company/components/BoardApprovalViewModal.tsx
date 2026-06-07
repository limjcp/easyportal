import { useEffect, type ReactNode } from "react";
import {
  FaCheck,
  FaDownload,
  FaFilePdf,
  FaPrint,
  FaTimes,
  FaUsers,
} from "react-icons/fa";
import type { BoardApprovalDetail, BoardApprovalVote } from "../../resident/data/types";
import { StatusBadge } from "../../admin/components/AdminBadges";

type BoardApprovalViewModalProps = {
  open: boolean;
  detail: BoardApprovalDetail | null;
  loading?: boolean;
  onClose: () => void;
};

function Panel({
  title,
  icon,
  children,
  badge,
  action,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  badge?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {icon}
          {title}
        </h4>
        {badge ?? action}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function VoteIcon({ kind }: { kind: BoardApprovalVote["kind"] }) {
  if (kind === "approved") return <span className="text-green-600">✓</span>;
  if (kind === "disapproved") return <span className="text-red-600">✕</span>;
  return <span className="text-slate-400">—</span>;
}

export function BoardApprovalViewModal({ open, detail, loading = false, onClose }: BoardApprovalViewModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  if (!detail) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
        <div className="rounded-sm bg-white px-8 py-6 text-center text-sm text-slate-600 shadow-2xl">
          <p>{loading ? "Loading board approval…" : "Board approval not found."}</p>
          {!loading ? (
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-2 sm:p-4 sm:pt-6">
      <div className="mb-6 flex w-full max-w-5xl flex-col rounded-sm bg-white shadow-2xl" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border border-slate-800 bg-slate-800 px-3 py-1 text-xs text-white hover:bg-slate-700"
                onClick={() => alert("Export — coming soon.")}
              >
                <FaDownload className="mr-1 inline" />
                Export Board Approval
              </button>
              <button
                type="button"
                className="rounded bg-[#337ab7] px-3 py-1 text-xs text-white hover:bg-[#286090]"
                onClick={() => window.print()}
              >
                <FaPrint className="mr-1 inline" />
                Print Board Approval
              </button>
            </div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <FaUsers className="text-slate-500" />
              {detail.title}
            </h2>
            {detail.closedBy && (
              <span className="mt-2 inline-block rounded bg-[#5cb85c] px-2 py-1 text-xs font-medium text-white">
                {detail.closedBy}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="max-h-[min(75vh,900px)] overflow-y-auto px-4 py-4 sm:px-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <Panel
                title="Current Results:"
                icon={<FaCheck className="text-green-600" />}
                badge={<StatusBadge status={detail.status} />}
              >
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-slate-600">Approved:</p>
                    <p className="text-2xl font-bold text-green-600">{detail.approvedCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Disapproved:</p>
                    <p className="text-2xl font-bold text-red-600">{detail.disapprovedCount}</p>
                  </div>
                </div>
                <p className="mt-3 text-center text-sm text-slate-700">
                  <strong>{detail.votesCollected}</strong> of <strong>{detail.votesRequired}</strong>{" "}
                  Votes collected
                </p>
              </Panel>

              <Panel title="Votes:" icon={<FaCheck className="text-green-600" />}>
                {detail.votes.length === 0 ? (
                  <p className="text-center text-sm text-slate-500">No votes yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[320px] border border-slate-200 text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-2 py-2 text-center">Vote</th>
                          <th className="px-2 py-2 text-center">Board Member</th>
                          <th className="px-2 py-2 text-center">Vote Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.votes.map((vote, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="px-2 py-2 text-center">
                              <VoteIcon kind={vote.kind} />
                            </td>
                            <td className="px-2 py-2 text-center">{vote.boardMember}</td>
                            <td className="px-2 py-2 text-center">{vote.voteDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>

            <Panel title="Details:" icon={<span className="text-slate-500">📄</span>}>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Created By:</label>
                  <input readOnly value={detail.createdBy} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm bg-slate-50" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Date Created:</label>
                  <input readOnly value={detail.dateCreated} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm bg-slate-50" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Description:</label>
                  <textarea
                    readOnly
                    rows={8}
                    value={detail.description}
                    className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm bg-slate-50"
                  />
                </div>
              </div>
            </Panel>
          </div>

          <div className="mt-4">
            <Panel title="Attachments:" icon={<span className="text-slate-500">📎</span>}>
              {detail.attachments.length === 0 ? (
                <p className="text-center text-sm text-slate-500">No attachments.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {detail.attachments.map((att) => (
                    <div key={att.id}>
                      <p className="mb-1 text-sm font-medium text-slate-600">{att.label}</p>
                      <button
                        type="button"
                        onClick={() => alert("Open attachment — coming soon.")}
                        className="text-left hover:opacity-90"
                      >
                        <FaFilePdf className="text-3xl text-red-600" />
                        <p className="mt-1 text-sm text-slate-800">{att.fileName}</p>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="mt-4">
            <Panel
              title="Scrollable Admin Comments"
              action={
                <button
                  type="button"
                  className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                  onClick={() => alert("Add comment — coming soon.")}
                >
                  + Add
                </button>
              }
            >
              <div className="max-h-[325px] space-y-4 overflow-y-auto overflow-x-hidden pr-2">
                {detail.comments.length === 0 ? (
                  <p className="text-center text-sm text-slate-500">No comments.</p>
                ) : (
                  detail.comments.map((c, i) => (
                    <div key={i}>
                      <p className="mb-1 text-sm font-semibold text-slate-800">{c.dateTime}:</p>
                      <div className="rounded-r-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <strong>{c.author}:</strong>
                        <br />
                        {c.message.split("\n").map((line, j) => (
                          <span key={j}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 px-4 py-3">
          {!detail.archived && (
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              onClick={() => alert("Archive — coming soon.")}
            >
              Archive
            </button>
          )}
          {!detail.unread && (
            <button
              type="button"
              className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
              onClick={() => alert("Set as Unread — coming soon.")}
            >
              <FaCheck className="mr-1 inline" />
              Set as Unread
            </button>
          )}
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
