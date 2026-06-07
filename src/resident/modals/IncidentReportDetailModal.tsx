import { useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { IncidentReportAttachmentGrid } from "../../shared/IncidentReportAttachmentThumb";
import { residentRepo } from "../data/mockRepository";
import type { ResidentIncidentReportDetail } from "../data/types";

type IncidentReportDetailModalProps = {
  open: boolean;
  reportId: string | null;
  onClose: () => void;
  onUpdated: () => void;
};

function statusClass(status: string): string {
  if (status === "Resolved") return "bg-[#5cb85c] text-white";
  if (status === "Pending") return "bg-amber-500 text-white";
  return "bg-slate-500 text-white";
}

export function IncidentReportDetailModal({
  open,
  reportId,
  onClose,
  onUpdated,
}: IncidentReportDetailModalProps) {
  const [report, setReport] = useState<ResidentIncidentReportDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    if (!open || !reportId) {
      setReport(null);
      setCommentText("");
      setShowCommentForm(false);
      return;
    }
    setLoading(true);
    residentRepo
      .getIncidentReportById(reportId)
      .then(setReport)
      .catch((err) => {
        alert(err instanceof Error ? err.message : "Failed to load incident report.");
        onClose();
      })
      .finally(() => setLoading(false));
  }, [open, reportId]);

  const refresh = async () => {
    if (!reportId) return;
    const updated = await residentRepo.getIncidentReportById(reportId);
    if (updated) setReport(updated);
    onUpdated();
  };

  const handleAddComment = async () => {
    if (!reportId || !commentText.trim()) return;
    setAddingComment(true);
    try {
      await residentRepo.addIncidentReportComment(reportId, commentText.trim());
      setCommentText("");
      setShowCommentForm(false);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add comment.");
    } finally {
      setAddingComment(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={report ? `Incident Report` : "Incident Report"}
      icon={<FaExclamationTriangle className="text-[#3476ef]" />}
      size="lg"
      footer={
        <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm text-black">
          Close
        </button>
      }
    >
      {loading || !report ? (
        <p className="text-sm text-slate-500">{loading ? "Loading…" : "Report not found."}</p>
      ) : (
        <div className="space-y-4">
          {report.archived ? (
            <p className="rounded border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700">
              This report has been archived by building management.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusClass(report.status)}`}>
              {report.status}
            </span>
            <span className="text-xs text-slate-500">{report.severity} severity</span>
            {report.pendingReplyLabel && report.pendingReplyLabel !== "N/A" ? (
              <span className="text-xs text-slate-500">Pending reply: {report.pendingReplyLabel}</span>
            ) : null}
          </div>

          {report.status === "Resolved" && report.resolvedBy ? (
            <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              Resolved by {report.resolvedBy}
              {report.resolvedAt ? ` on ${new Date(report.resolvedAt).toLocaleDateString()}` : ""}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <DetailField label="Incident Date" value={report.incidentDate} />
            <DetailField label="Incident Time" value={report.incidentTime} />
            <DetailField label="Type" value={report.reportType} />
            <DetailField label="Location" value={report.location} />
            {report.submittedAt ? (
              <DetailField label="Submitted" value={new Date(report.submittedAt).toLocaleString()} />
            ) : null}
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{report.description}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-slate-500">File Attachments</p>
            <div className="mt-2 rounded border border-slate-200 bg-white p-3">
              <IncidentReportAttachmentGrid attachments={report.attachments} />
            </div>
          </div>

          <div className="overflow-hidden rounded border border-slate-300">
            <div className="flex items-center justify-between bg-slate-500 px-3 py-2 text-sm font-medium text-white">
              <span>Comments</span>
              <button
                type="button"
                onClick={() => setShowCommentForm((value) => !value)}
                className="rounded bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30"
              >
                + Add
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto bg-white p-3 text-sm">
              {showCommentForm ? (
                <div className="mb-3 space-y-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-black"
                    placeholder="Enter comment..."
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={addingComment}
                      className="rounded bg-[#3476ef] px-3 py-1 text-xs text-white disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCommentForm(false);
                        setCommentText("");
                      }}
                      className="rounded border border-slate-300 px-3 py-1 text-xs text-black"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
              {report.publicComments.length === 0 ? (
                <p className="text-slate-500">No comments yet.</p>
              ) : (
                <div className="space-y-3">
                  {report.publicComments.map((comment) => (
                    <div key={comment.id} className="border-b border-slate-100 pb-2 last:border-0">
                      <p className="text-xs text-slate-500">
                        {new Date(comment.createdAt).toLocaleString()}: {comment.author}
                      </p>
                      <p className="mt-1 text-slate-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-slate-800">{value || "—"}</p>
    </div>
  );
}
