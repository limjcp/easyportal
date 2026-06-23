import { useCallback, useEffect, useRef, useState } from "react";
import { FaEnvelope, FaExclamationTriangle, FaPrint } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { useBusyWhile } from "../../shared/useBusyWhile";
import { IncidentReportAttachmentGrid } from "../../shared/IncidentReportAttachmentThumb";
import { AdminSectionHeader, CommentSection } from "../components/CommentSection";
import { SeverityBadge, StatusBadge, UnreadBadge } from "../components/AdminBadges";
import { adminRepository } from "../data/adminRepository";
import type {
  AdminIncidentReport,
  IncidentPendingReply,
  IncidentReportStatus,
} from "../../resident/data/types";

type IncidentReportDetailModalProps = {
  open: boolean;
  reportId: string | null;
  onClose: () => void;
  onUpdated: (updated: AdminIncidentReport) => void;
  archived?: boolean;
  onViewRelated?: (unit: string, owner: string) => void;
};

const VISIBILITY_OPTIONS = [
  "All Admins",
  "Only Administrators",
  "All users in this unit can see this report",
];

const ASSIGNED_OPTIONS = ["All Admins", "Property Manager", "Claudio Owner", "Scott Munday"];

export function IncidentReportDetailModal({
  open,
  reportId,
  onClose,
  onUpdated,
  archived = false,
  onViewRelated,
}: IncidentReportDetailModalProps) {
  const [report, setReport] = useState<AdminIncidentReport | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [customAdminType, setCustomAdminType] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("Admin");
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const pendingMutationRef = useRef<(() => Promise<unknown>) | null>(null);
  const pendingCommentRef = useRef<{ text: string; visibility: "admin" | "public" } | null>(null);
  const pendingFileRef = useRef<File | null>(null);
  const pendingAttachmentIdRef = useRef<string | null>(null);

  const reloadDetail = useCallback(
    async (notifyList = false) => {
      if (!reportId) return null;
      const updated = await adminRepository.getIncidentReportById(reportId);
      if (updated) setReport(updated);
      if (notifyList && updated) onUpdated(updated);
      return updated;
    },
    [reportId, onUpdated]
  );

  const { run: runMutation, loading: mutating, error, clearError } = useAsyncAction(
    useCallback(async () => {
      const mutation = pendingMutationRef.current;
      if (!mutation) return;
      await mutation();
      await reloadDetail(true);
    }, [reloadDetail]),
    { showSuccessToast: false, showErrorToast: false }
  );

  const queueMutation = (mutation: () => Promise<unknown>, successMessage?: string) => {
    pendingMutationRef.current = mutation;
    clearError();
    void runMutation().then(() => {
      if (successMessage) {
        // toast handled by individual actions when needed
      }
    });
  };

  const { run: addCommentRun, error: commentError } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingCommentRef.current;
      if (!reportId || !pending) return;
      await adminRepository.addIncidentReportComment(
        reportId,
        {
          author: commentAuthor,
          text: pending.text,
          createdAt: new Date().toLocaleString(),
          visibility: pending.visibility,
        },
        pending.visibility
      );
      await reloadDetail(false);
    }, [reportId, commentAuthor, reloadDetail]),
    { successMessage: "Comment added.", showErrorToast: false }
  );

  const { run: addAttachmentRun } = useAsyncAction(
    useCallback(async () => {
      const file = pendingFileRef.current;
      if (!reportId || !file) return;
      await adminRepository.addIncidentReportAttachment(reportId, file);
      await reloadDetail(false);
    }, [reportId, reloadDetail]),
    { successMessage: "Attachment added.", showErrorToast: false }
  );

  const { run: removeAttachmentRun } = useAsyncAction(
    useCallback(async () => {
      const attachmentId = pendingAttachmentIdRef.current;
      if (!attachmentId) return;
      await adminRepository.removeIncidentReportAttachment(attachmentId);
      await reloadDetail(false);
    }, [reloadDetail]),
    { successMessage: "Attachment removed.", showErrorToast: false }
  );

  useEffect(() => {
    if (open && reportId) {
      adminRepository.getIncidentReportById(reportId).then(setReport);
      adminRepository.getAdminUser().then((user) => setCommentAuthor(user.displayName || "Admin"));
      adminRepository.getIncidentCategories().then((cats) =>
        setCategories(
          (() => {
            const active = cats.filter((c) => c.status === "active").map((c) => c.name);
            return active.includes("Other") ? active : [...active, "Other"];
          })()
        )
      );
    } else {
      setReport(null);
    }
  }, [open, reportId]);

  useBusyWhile(open && !!reportId && !report);

  const addComment = (text: string, visibility: "admin" | "public") => {
    pendingCommentRef.current = { text, visibility };
    void addCommentRun();
  };

  const addAttachment = (file: File | null) => {
    pendingFileRef.current = file;
    void addAttachmentRun();
  };

  const removeAttachment = (attachmentId: string) => {
    pendingAttachmentIdRef.current = attachmentId;
    void removeAttachmentRun();
  };

  if (!open) return null;

  if (!report) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Incident Report"
        icon={<FaExclamationTriangle className="text-red-600" />}
        size="xl"
      />
    );
  }

  const markResolved = () => {
    queueMutation(() =>
      adminRepository.updateIncidentReport(report.id, {
        status: "Resolved",
        resolvedBy: "Claudio Owner",
        resolvedAt: new Date().toLocaleDateString(),
        pendingReply: "No",
      })
    );
  };

  const updateReport = (updates: Partial<AdminIncidentReport>) => {
    queueMutation(() => adminRepository.updateIncidentReport(report.id, updates));
  };

  const formError = error ?? commentError;

  const incidentTypeOptions = Array.from(
    new Set([...(categories.length ? categories : [report.adminType]), report.adminType].filter(Boolean))
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Incident Report #${report.id}`}
      icon={<FaExclamationTriangle className="text-red-600" />}
      size="xl"
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => updateReport({ unread: true })}
            className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white"
          >
            Set as Unread
          </button>
          <button
            type="button"
            onClick={() =>
              updateReport({
                status: "Pending",
                archived: false,
                resolvedBy: undefined,
                resolvedAt: undefined,
              })
            }
            className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white"
          >
            Reopen and Revert to Pending
          </button>
          {!archived && (
            <button
              type="button"
              onClick={() => {
                queueMutation(async () => {
                  await adminRepository.archiveIncidentReport(report.id);
                  onClose();
                });
              }}
              className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white"
            >
              Archive
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              adminRepository.getIncidentContactEmails().then((contacts) => {
                const active = contacts.filter((c) => c.status === "active").map((c) => c.email);
                alert(
                  active.length
                    ? `Email report (demo): would send to:\n${active.join("\n")}`
                    : "No active contact emails configured."
                );
              });
            }}
            className="inline-flex items-center gap-2 rounded bg-[#79d0df] px-3 py-1.5 text-sm text-white"
          >
            <FaEnvelope />
            Email
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded bg-[#79d0df] px-3 py-1.5 text-sm text-white"
          >
            <FaPrint />
            Print
          </button>
          {report.status !== "Resolved" && (
            <ActionButton
              label="Mark Resolved"
              variant="success"
              loading={mutating}
              loadingLabel="Saving…"
              onClick={markResolved}
            />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-1.5 text-sm"
          >
            Close
          </button>
        </div>
      }
    >
      {formError ? <FormAlert message={formError} className="mb-4" /> : null}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {report.unread && <UnreadBadge />}
        <StatusBadge status={report.status as IncidentReportStatus} />
        <SeverityBadge severity={report.adminSeverity} />
        <span className="text-xs text-slate-500">Pending reply: {report.pendingReply}</span>
        {report.resolvedBy && (
          <span className="rounded bg-[#5cb85c] px-2 py-0.5 text-xs text-white">
            Resolved by {report.resolvedBy} on {report.resolvedAt}
          </span>
        )}
        {report.resolutionTime && report.resolutionTime !== "—" && (
          <span className="text-xs text-slate-500">Resolution time: {report.resolutionTime}</span>
        )}
      </div>

      <AdminSectionHeader title="Assignment & Users" />
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <ReadField label="Created By" value={report.createdBy} />
        <ReadField label="Submitted" value={report.submittedAt} />
        <SelectField
          label="Assigned To Admin *"
          value={report.assignedToAdmin}
          options={ASSIGNED_OPTIONS}
          onChange={(v) => updateReport({ assignedToAdmin: v })}
        />
        <ReadField label="Resident" value={report.resident} />
        <ReadField label="Unit" value={report.unit} />
        <SelectField
          label="Who can view this report *"
          value={report.visibility}
          options={VISIBILITY_OPTIONS}
          onChange={(v) => updateReport({ visibility: v })}
        />
      </div>
      {onViewRelated && report.unit && report.resident && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => onViewRelated(report.unit, report.resident)}
            className="text-sm font-medium text-[#3476ef] hover:underline"
          >
            View all reports for this unit & owner
          </button>
        </div>
      )}

      <AdminSectionHeader title="Incident Details" color="blue" />
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <ReadField label="Incident Date" value={report.incidentDate} />
        <ReadField label="Incident Time" value={report.incidentTime} />
        <SelectField
          label="Admin Severity *"
          value={report.adminSeverity}
          options={["Low", "Medium", "High"]}
          onChange={(v) => updateReport({ adminSeverity: v, severity: v })}
        />
        <ReadField label="Resident Severity" value={report.severity} />
        <SelectField
          label="Admin Type *"
          value={report.adminType}
          options={incidentTypeOptions}
          onChange={async (v) => {
            if (v === "Other") {
              setReport({ ...report, adminType: "Other" });
              return;
            }
            const resolved = await adminRepository.resolveIncidentCategoryName(v);
            updateReport({ adminType: resolved, reportType: resolved });
          }}
        />
        {report.adminType === "Other" && (
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Custom Type *
              <input
                type="text"
                value={customAdminType}
                onChange={(e) => setCustomAdminType(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
              />
            </label>
            <ActionButton
              label="Save Custom Type"
              className="px-3 py-1 text-xs"
              loading={mutating}
              onClick={async () => {
                if (!customAdminType.trim()) {
                  alert("Please enter a custom incident type.");
                  return;
                }
                const resolved = await adminRepository.resolveIncidentCategoryName(
                  "Other",
                  customAdminType
                );
                setCustomAdminType("");
                updateReport({ adminType: resolved, reportType: resolved });
              }}
            />
          </div>
        )}
        <ReadField label="Resident Type" value={report.reportType} />
        <SelectField
          label="Status *"
          value={report.status}
          options={["Draft", "Pending", "Resolved"]}
          onChange={(v) => updateReport({ status: v as IncidentReportStatus })}
        />
        <SelectField
          label="Pending Reply"
          value={report.pendingReply}
          options={["Yes", "No", "N/A"]}
          onChange={(v) => updateReport({ pendingReply: v as IncidentPendingReply })}
        />
      </div>
      <div className="p-3">
        <ReadField label="Location" value={report.location} />
      </div>
      <div className="p-3 pt-0">
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          readOnly
          value={report.description}
          rows={5}
          className="mt-1 w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
        />
      </div>

      <AdminSectionHeader
        title="File Attachments"
        action={
          <>
            <input
              ref={attachmentInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                void addAttachment(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => attachmentInputRef.current?.click()}
              className="rounded bg-white/20 px-2 py-0.5 text-xs"
            >
              + Add
            </button>
          </>
        }
      />
      <div className="p-3">
        <IncidentReportAttachmentGrid
          attachments={report.attachments}
          onRemove={(attachmentId) => void removeAttachment(attachmentId)}
        />
      </div>

      <CommentSection
        title="Scrollable Admin Comments"
        subtitle="(Visible to Admins ONLY)"
        comments={report.adminComments}
        adminOnly
        headerColor="orange"
        onAdd={(text) => addComment(text, "admin")}
      />

      <CommentSection
        title="Scrollable Comments"
        subtitle="(Visible to Resident & Admin)"
        comments={report.publicComments}
        headerColor="gray"
        onAdd={(text) => addComment(text, "public")}
      />
    </Modal>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm text-slate-800">{value || "—"}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded border border-slate-300 px-2 py-1"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
