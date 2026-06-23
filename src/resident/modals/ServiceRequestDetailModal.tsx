import { useCallback, useEffect, useState } from "react";
import { FaWrench } from "react-icons/fa";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { Modal } from "../../shared/Modal";
import { IncidentReportAttachmentGrid } from "../../shared/IncidentReportAttachmentThumb";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { useBusyWhile } from "../../shared/useBusyWhile";
import { residentRepo } from "../data/mockRepository";
import type { ResidentServiceRequestDetail } from "../data/types";

type ServiceRequestDetailModalProps = {
  open: boolean;
  requestId: string | null;
  onClose: () => void;
  onUpdated: () => void;
};

function statusClass(status: string): string {
  if (status === "Resolved") return "bg-[#5cb85c] text-white";
  if (status === "Pending") return "bg-amber-500 text-white";
  return "bg-slate-500 text-white";
}

export function ServiceRequestDetailModal({
  open,
  requestId,
  onClose,
  onUpdated,
}: ServiceRequestDetailModalProps) {
  const [request, setRequest] = useState<ResidentServiceRequestDetail | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);

  const refresh = useCallback(async () => {
    if (!requestId) return;
    const updated = await residentRepo.getServiceRequestById(requestId);
    if (updated) setRequest(updated);
    onUpdated();
  }, [onUpdated, requestId]);

  const { run: loadRequest, loading, error: loadError } = useAsyncAction(
    useCallback(async () => {
      if (!requestId) return;
      const data = await residentRepo.getServiceRequestById(requestId);
      setRequest(data);
    }, [requestId]),
    {
      errorMessage: "Failed to load service request.",
      onError: () => onClose(),
      trackBusy: false,
    }
  );

  const { run: addComment, loading: addingComment, error: commentError, clearError } = useAsyncAction(
    useCallback(async () => {
      if (!requestId || !commentText.trim()) return;
      await residentRepo.addServiceRequestComment(requestId, commentText.trim());
      setCommentText("");
      setShowCommentForm(false);
      await refresh();
    }, [commentText, refresh, requestId]),
    {
      successMessage: "Comment added.",
      errorMessage: "Failed to add comment.",
    }
  );

  useEffect(() => {
    if (!open || !requestId) {
      setRequest(null);
      setCommentText("");
      setShowCommentForm(false);
      return;
    }
    void loadRequest();
  }, [loadRequest, open, requestId]);

  const handleAddComment = () => {
    clearError();
    if (!commentText.trim()) return;
    void addComment();
  };

  const displayError = loadError ?? commentError;

  useBusyWhile(open && loading);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Service Request"
      icon={<FaWrench className="text-[#3476ef]" />}
      size="lg"
      footer={
        <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm text-black">
          Close
        </button>
      }
    >
      {displayError ? <FormAlert message={displayError} className="mb-3" /> : null}
      {!loading && !request ? (
        <p className="text-sm text-slate-500">Service request not found.</p>
      ) : null}
      {request ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusClass(request.status)}`}>
              {request.status}
            </span>
            <span className="text-xs text-slate-500">{request.severity} severity</span>
            <span className="text-xs text-slate-500">{request.category}</span>
          </div>

          {request.status === "Resolved" && request.resolvedBy ? (
            <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              Resolved by {request.resolvedBy}
              {request.resolvedAt ? ` on ${new Date(request.resolvedAt).toLocaleDateString()}` : ""}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <DetailField label="Location" value={request.location} />
            <DetailField label="Contact" value={request.contact} />
            <DetailField label="Visibility" value={request.visibility} />
            <DetailField label="Permission to Enter" value={request.permissionToEnter} />
            {request.permissionNotes ? (
              <DetailField label="Permission Notes" value={request.permissionNotes} />
            ) : null}
            {request.submittedAt ? (
              <DetailField label="Submitted" value={new Date(request.submittedAt).toLocaleString()} />
            ) : null}
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{request.description}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-slate-500">File Attachments</p>
            <div className="mt-2 rounded border border-slate-200 bg-white p-3">
              <IncidentReportAttachmentGrid attachments={request.attachments} />
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
                    <ActionButton
                      label="Save"
                      loadingLabel="Saving…"
                      loading={addingComment}
                      className="px-3 py-1 text-xs"
                      onClick={handleAddComment}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCommentForm(false);
                        setCommentText("");
                        clearError();
                      }}
                      className="rounded border border-slate-300 px-3 py-1 text-xs text-black"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
              {request.publicComments.length === 0 ? (
                <p className="text-slate-500">No comments yet.</p>
              ) : (
                <div className="space-y-3">
                  {request.publicComments.map((comment) => (
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
      ) : null}
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
