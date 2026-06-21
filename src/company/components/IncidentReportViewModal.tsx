import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { FaExclamationTriangle, FaPrint, FaTimes } from "react-icons/fa";
import { IncidentReportAttachmentThumb } from "../../shared/IncidentReportAttachmentThumb";
import { ConfirmModal } from "../../shared/ConfirmModal";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { companyRepository } from "../data/companyRepository";
import type { IncidentReportDetail } from "../../resident/data/types";

type IncidentReportViewModalProps = {
  open: boolean;
  detail: IncidentReportDetail | null;
  loading?: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onViewRelated?: (unit: string, owner: string) => void;
};

const inputClass =
  "mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800";

function DisabledField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="mb-2.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input type="text" readOnly disabled value={value ?? ""} className={inputClass} />
    </div>
  );
}

function DangerPanel({
  title,
  toolbar,
  children,
  headerRight,
}: {
  title: ReactNode;
  toolbar?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-[#ebccd1]">
      <div className="flex items-center justify-between bg-[#d9534f] px-3 py-2 text-white">
        <h4 className="text-sm font-semibold">{title}</h4>
        <div className="flex items-center gap-2">
          {headerRight}
          {toolbar}
        </div>
      </div>
      <div className="bg-white p-3">{children}</div>
    </div>
  );
}

function DefaultPanel({
  title,
  toolbar,
  children,
  headerClass = "bg-slate-100 text-slate-800",
}: {
  title: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  headerClass?: string;
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-slate-200">
      <div className={`flex items-center justify-between px-3 py-2 ${headerClass}`}>
        <h4 className="text-sm font-semibold">{title}</h4>
        {toolbar}
      </div>
      <div className="bg-white p-3">{children}</div>
    </div>
  );
}

function InlineCommentForm({
  onSave,
  onCancel,
  saving,
}: {
  onSave: (text: string) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <div className="mb-3 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        placeholder="Enter comment..."
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving || !text.trim()}
          onClick={() => {
            onSave(text.trim());
            setText("");
          }}
          className="rounded bg-[#337ab7] px-3 py-1 text-xs text-white hover:bg-[#286090] disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function IncidentReportViewModal({
  open,
  detail,
  loading = false,
  onClose,
  onRefresh,
  onViewRelated,
}: IncidentReportViewModalProps) {
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [addingAdminComment, setAddingAdminComment] = useState(false);
  const [addingPublicComment, setAddingPublicComment] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"archive" | "reopen" | null>(null);

  const pendingCommentRef = useRef<{ text: string; visibility: "admin" | "public" } | null>(null);
  const pendingFileRef = useRef<File | null>(null);

  const refresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const { run: runComment, loading: savingComment } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingCommentRef.current;
      if (!detail || !pending) return;
      await companyRepository.addIncidentReportComment(
        detail.id,
        { author: "Company Admin", text: pending.text, createdAt: new Date().toISOString(), visibility: pending.visibility },
        pending.visibility
      );
      setAddingAdminComment(false);
      setAddingPublicComment(false);
      refresh();
    }, [detail, refresh]),
    { successMessage: "Comment added." }
  );

  const { run: runAttachment, loading: savingAttachment } = useAsyncAction(
    useCallback(async () => {
      const file = pendingFileRef.current;
      if (!detail || !file) return;
      await companyRepository.addIncidentReportAttachment(detail.id, file);
      refresh();
    }, [detail, refresh]),
    { successMessage: "Attachment added." }
  );

  const { run: runMarkUnread, loading: markingUnread } = useAsyncAction(
    useCallback(async () => {
      if (!detail) return;
      await companyRepository.markIncidentReportUnread(detail.id);
      refresh();
    }, [detail, refresh]),
    { successMessage: "Marked as unread." }
  );

  const { run: runArchive, loading: archiving } = useAsyncAction(
    useCallback(async () => {
      if (!detail) return;
      await companyRepository.archiveIncidentReport(detail.id);
      setConfirmAction(null);
      onClose();
      onRefresh?.();
    }, [detail, onClose, onRefresh]),
    { successMessage: "Incident report archived." }
  );

  const { run: runReopen, loading: reopening } = useAsyncAction(
    useCallback(async () => {
      if (!detail) return;
      await companyRepository.reopenIncidentReport(detail.id);
      setConfirmAction(null);
      refresh();
    }, [detail, refresh]),
    { successMessage: "Incident report reopened." }
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setAddingAdminComment(false);
      setAddingPublicComment(false);
      setConfirmAction(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !detail) return;
    const t = setTimeout(() => {
      const el = document.getElementById("commentsSection");
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
    return () => clearTimeout(t);
  }, [open, detail?.id]);

  if (!open) return null;

  if (!detail) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
        <div className="rounded-sm bg-white px-8 py-6 text-center text-sm text-slate-600 shadow-2xl">
          <p>{loading ? "Loading incident report…" : "Incident report not found."}</p>
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

  const resolvedLabel =
    detail.resolvedBy && detail.resolvedAtDisplay
      ? `Resolved by ${detail.resolvedBy} on ${detail.resolvedAtDisplay}`
      : detail.resolvedBy
        ? `Resolved by ${detail.resolvedBy}${detail.resolvedAt ? ` on ${detail.resolvedAt}` : ""}`
        : null;

  const actionLoading = savingComment || savingAttachment || markingUnread || archiving || reopening;

  return (
    <>
      <input
        ref={attachmentInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            pendingFileRef.current = file;
            void runAttachment();
          }
          e.target.value = "";
        }}
      />

      <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-2 sm:p-4 sm:pt-6">
        <div
          className="mb-6 flex w-full max-w-5xl flex-col rounded-sm bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="incident-report-title"
        >
          <div className="border-b border-slate-200 bg-white px-5 pb-5 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="float-right text-slate-500 hover:text-slate-800"
              aria-label="Close"
            >
              <FaTimes className="text-base" />
            </button>
            <h2
              id="incident-report-title"
              className="clear-both flex flex-wrap items-center gap-2 text-xl font-normal text-slate-800"
            >
              <FaExclamationTriangle className="text-[#d9534f]" />
              Incident Report #{detail.incidentNumber}
              {resolvedLabel && (
                <span className="ml-auto rounded bg-[#5cb85c] px-2 py-1 text-xs font-medium text-white">
                  {resolvedLabel}
                </span>
              )}
              <span className="rounded bg-[#d9534f] px-2 py-1 text-xs font-medium text-white">
                {detail.severity} Severity
              </span>
            </h2>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5">
            <DangerPanel
              title="Incident Report:"
              headerRight={
                <span className="text-xs font-normal opacity-95">
                  {detail.reportHeaderTime ?? detail.submittedAt ?? detail.incidentDate}
                </span>
              }
            >
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <DefaultPanel title="User Information:">
                    <DisabledField label="Created By:" value={detail.createdBy} />
                    <DisabledField label="Resident:" value={detail.resident ?? detail.createdBy} />
                    <DisabledField label="Unit:" value={detail.unit} />
                    {onViewRelated && detail.unit && (detail.resident ?? detail.createdBy) && (
                      <button
                        type="button"
                        onClick={() => onViewRelated(detail.unit, detail.resident ?? detail.createdBy)}
                        className="mt-1 text-sm font-medium text-[#3476ef] hover:underline"
                      >
                        View all reports for this unit & owner
                      </button>
                    )}
                  </DefaultPanel>
                </div>
                <div className="lg:col-span-7">
                  <DefaultPanel title="Assignment & View Permission:">
                    <DisabledField label="Assigned To:" value={detail.assignedTo ?? "All Admins"} />
                    <DisabledField
                      label="Who can view this Request:"
                      value={detail.viewPermission ?? "The selected resident"}
                    />
                  </DefaultPanel>
                </div>
              </div>

              <div className="mt-4">
                <DefaultPanel title="Incident Report Details:">
                  <DisabledField label="Building:" value={detail.buildingAddress ?? detail.buildingLabel} />
                  <div className="grid gap-0 sm:grid-cols-12">
                    <div className="sm:col-span-2">
                      <DisabledField label="Severity:" value={detail.severity} />
                    </div>
                    <div className="sm:col-span-5">
                      <DisabledField label="Incident Report Type:" value={detail.reportType} />
                    </div>
                    <div className="sm:col-span-5">
                      <DisabledField label="Location:" value={detail.location} />
                    </div>
                  </div>
                  <div className="mt-1">
                    <label className="text-sm font-medium text-slate-700">Description:</label>
                    <textarea
                      readOnly
                      disabled
                      rows={8}
                      value={detail.description}
                      className={`${inputClass} mt-1 resize-none`}
                    />
                  </div>
                </DefaultPanel>
              </div>
            </DangerPanel>

            <DangerPanel
              title="File Attachments:"
              toolbar={
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => attachmentInputRef.current?.click()}
                  className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  + Add
                </button>
              }
            >
              {detail.attachments.length === 0 ? (
                <p className="text-center text-sm text-slate-500">No attachments.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  {detail.attachments.map((att) => (
                    <IncidentReportAttachmentThumb key={att.id} attachment={att} />
                  ))}
                </div>
              )}
            </DangerPanel>

            <div>
              <DangerPanel
                title={
                  <>
                    Scrollable Admin Comments{" "}
                    <span className="text-xs font-normal">
                      (Visible to Admins <strong className="underline">ONLY</strong>)
                    </span>
                  </>
                }
                toolbar={
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setAddingAdminComment((v) => !v)}
                    className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    + Add
                  </button>
                }
              >
                <div id="adminCommentsSection" className="max-h-[325px] overflow-y-auto overflow-x-hidden">
                  {addingAdminComment && (
                    <InlineCommentForm
                      saving={savingComment}
                      onCancel={() => setAddingAdminComment(false)}
                      onSave={(text) => {
                        pendingCommentRef.current = { text, visibility: "admin" };
                        void runComment();
                      }}
                    />
                  )}
                  {detail.adminComments.length === 0 && !addingAdminComment ? (
                    <p className="mt-1 text-center text-sm text-slate-500">No Comments.</p>
                  ) : (
                    detail.adminComments.map((c, i) => (
                      <div key={`admin-${i}`} className="mb-4">
                        <strong className="text-sm">{c.dateTime}:</strong>
                        <div
                          className="mt-1 border border-[#d9d9d9] bg-[#f5f7f7] px-4 py-2 text-sm"
                          style={{ borderRadius: "0 20px 20px 0" }}
                        >
                          <strong>{c.author}:</strong>
                          <br />
                          {c.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DangerPanel>
            </div>

            <DefaultPanel
              title={
                <>
                  Scrollable Comments:{" "}
                  <span className="text-xs font-normal">(Visible to Resident & Admins)</span>
                </>
              }
              headerClass="bg-slate-100 text-slate-800"
              toolbar={
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setAddingPublicComment((v) => !v)}
                  className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  + Add
                </button>
              }
            >
              <div id="commentsSection" className="max-h-[325px] overflow-y-auto overflow-x-hidden">
                {addingPublicComment && (
                  <InlineCommentForm
                    saving={savingComment}
                    onCancel={() => setAddingPublicComment(false)}
                    onSave={(text) => {
                      pendingCommentRef.current = { text, visibility: "public" };
                      void runComment();
                    }}
                  />
                )}
                {detail.publicComments.length === 0 && !addingPublicComment ? (
                  <p className="mt-1 text-center text-sm text-slate-500">No Comments.</p>
                ) : (
                  detail.publicComments.map((c, i) => (
                    <div key={`pub-${i}`} className="mb-4 px-1">
                      <strong className="text-sm text-slate-800">{c.dateTime}:</strong>
                      <div
                        className="mt-1 border border-[#d9d9d9] bg-[#f5f7f7] px-4 py-2 text-sm text-slate-800"
                        style={{ borderRadius: "0 20px 20px 0" }}
                      >
                        <strong>{c.author}:</strong>
                        <br />
                        {c.message.split("\n").map((line, j) => (
                          <span key={j}>
                            {line}
                            {j < c.message.split("\n").length - 1 && <br />}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DefaultPanel>
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmAction("archive")}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Archive
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void runMarkUnread()}
                className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
              >
                Set as Unread
              </button>
              {detail.status === "Resolved" && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setConfirmAction("reopen")}
                  className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  Reopen and Revert to Pending
                </button>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded bg-[#5bc0de] px-3 py-1.5 text-sm text-white hover:bg-[#46b8da]"
              >
                <FaPrint className="mr-1 inline" />
                Print
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmAction === "archive"}
        onClose={() => setConfirmAction(null)}
        title="Archive Incident Report"
        message="Archive this incident report? It will move to the archived list."
        confirmLabel="Archive"
        onConfirm={() => void runArchive()}
        loading={archiving}
      />
      <ConfirmModal
        open={confirmAction === "reopen"}
        onClose={() => setConfirmAction(null)}
        title="Reopen Incident Report"
        message="Reopen this incident report and revert its status to Pending?"
        confirmLabel="Reopen"
        onConfirm={() => void runReopen()}
        loading={reopening}
      />
    </>
  );
}
