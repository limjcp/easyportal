import { useCallback, useEffect, useRef, useState } from "react";
import { FaPrint, FaWrench } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { ConfirmModal } from "../../shared/ConfirmModal";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { IncidentReportAttachmentGrid } from "../../shared/IncidentReportAttachmentThumb";
import { validateAttachmentFile } from "../../shared/attachmentUtils";
import { AdminSectionHeader, CommentSection } from "../components/CommentSection";
import { SeverityBadge } from "../components/AdminBadges";
import { adminRepository } from "../data/adminRepository";
import { companyRepository } from "../../company/data/companyRepository";
import { PurchaseOrderFormModal } from "../../company/modals/PurchaseOrderFormModal";
import type { AdminServiceRequest, PurchaseOrder, PurchaseOrderPrefill } from "../../resident/data/types";

type ServiceRequestDetailModalProps = {
  open: boolean;
  requestId: string | null;
  onClose: () => void;
  onUpdated: () => void;
  onViewRelated?: (unit: string, owner: string) => void;
};

export function ServiceRequestDetailModal({
  open,
  requestId,
  onClose,
  onUpdated,
  onViewRelated,
}: ServiceRequestDetailModalProps) {
  const [request, setRequest] = useState<AdminServiceRequest | null>(null);
  const [relatedPOs, setRelatedPOs] = useState<PurchaseOrder[]>([]);
  const [createPOOpen, setCreatePOOpen] = useState(false);
  const [poPrefill, setPoPrefill] = useState<PurchaseOrderPrefill | undefined>();
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [customAdminCategory, setCustomAdminCategory] = useState("");
  const [removeAttachmentOpen, setRemoveAttachmentOpen] = useState(false);
  const [commentAuthor, setCommentAuthor] = useState("Admin");
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const pendingMutationRef = useRef<(() => Promise<unknown>) | null>(null);
  const pendingCommentRef = useRef<{ text: string; visibility: "admin" | "public" } | null>(null);
  const pendingFileRef = useRef<File | null>(null);
  const pendingAttachmentIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!requestId) return;
    const updated = await adminRepository.getServiceRequestById(requestId);
    if (updated) setRequest(updated);
    const categories = await adminRepository.getServiceCategories();
    const activeNames = categories
      .filter((category) => category.status === "active")
      .map((category) => category.name);
    setServiceCategories(activeNames.includes("Other") ? activeNames : [...activeNames, "Other"]);
    const related = await companyRepository.getPurchaseOrdersBySourceRequest(
      "admin-service-request",
      requestId
    );
    setRelatedPOs(related);
    onUpdated();
  }, [requestId, onUpdated]);

  const { run: runMutation, loading: mutating, error, clearError } = useAsyncAction(
    useCallback(async () => {
      const mutation = pendingMutationRef.current;
      if (!mutation) return;
      await mutation();
      await refresh();
    }, [refresh]),
    { showSuccessToast: false, showErrorToast: false }
  );

  const queueMutation = (mutation: () => Promise<unknown>) => {
    pendingMutationRef.current = mutation;
    clearError();
    void runMutation();
  };

  const { run: addCommentRun, error: commentError } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingCommentRef.current;
      if (!request || !pending) return;
      await adminRepository.addServiceRequestComment(
        request.id,
        {
          author: commentAuthor,
          text: pending.text,
          createdAt: new Date().toLocaleString(),
          visibility: pending.visibility,
        },
        pending.visibility
      );
      await refresh();
    }, [request, commentAuthor, refresh]),
    { successMessage: "Comment added.", showErrorToast: false }
  );

  const { run: addAttachmentRun, error: attachmentError } = useAsyncAction(
    useCallback(async () => {
      const file = pendingFileRef.current;
      if (!file || !requestId) return;
      const validationError = validateAttachmentFile(file);
      if (validationError) {
        alert(validationError);
        return;
      }
      await adminRepository.addServiceRequestAttachment(requestId, file);
      await refresh();
    }, [requestId, refresh]),
    { successMessage: "Attachment added.", showErrorToast: false }
  );

  const { run: removeAttachmentRun, loading: removingAttachment } = useAsyncAction(
    useCallback(async () => {
      const attachmentId = pendingAttachmentIdRef.current;
      if (!attachmentId) return;
      await adminRepository.removeServiceRequestAttachment(attachmentId);
      await refresh();
      setRemoveAttachmentOpen(false);
      pendingAttachmentIdRef.current = null;
    }, [refresh]),
    { successMessage: "Attachment removed.", showErrorToast: false }
  );

  useEffect(() => {
    if (open && requestId) {
      adminRepository.getServiceRequestById(requestId).then(setRequest);
      adminRepository.getAdminUser().then((user) => setCommentAuthor(user.displayName || "Admin"));
      adminRepository.getServiceCategories().then((categories) => {
        const activeNames = categories
          .filter((category) => category.status === "active")
          .map((category) => category.name);
        setServiceCategories(activeNames.includes("Other") ? activeNames : [...activeNames, "Other"]);
      });
      companyRepository
        .getPurchaseOrdersBySourceRequest("admin-service-request", requestId)
        .then(setRelatedPOs);
    }
  }, [open, requestId]);

  if (!open || !request) return null;

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
    setRemoveAttachmentOpen(true);
  };

  const updateRequest = (updates: Partial<AdminServiceRequest>) => {
    queueMutation(() => adminRepository.updateServiceRequest(request.id, updates));
  };

  const markResolved = () => {
    queueMutation(() =>
      adminRepository.updateServiceRequest(request.id, {
        status: "Resolved",
        resolvedBy: commentAuthor,
        resolvedAt: new Date().toLocaleDateString(),
        pendingReply: false,
        actionRequired: false,
      })
    );
  };

  const formError = error ?? commentError ?? attachmentError;

  const handleGeneratePO = () => {
    const notes = [
      `Generated from admin service request ${request.id}`,
      `Resident: ${request.resident}`,
      `Unit: ${request.unit}`,
      `Location: ${request.location}`,
      `Description: ${request.description}`,
    ].join("\n");
    setPoPrefill({
      sourceRequest: { kind: "admin-service-request", requestId: request.id },
      initialLineItems: [{ description: request.description, quantity: 1, unitPrice: 0 }],
      notes,
    });
    setCreatePOOpen(true);
  };

  const categoryOptions = Array.from(
    new Set([...serviceCategories, request.adminCategory].filter(Boolean))
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Service Request #${request.id}`}
      icon={<FaWrench className="text-[#e8913a]" />}
      size="xl"
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => updateRequest({ pendingReply: true })}
            className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white"
          >
            Set as Unread
          </button>
          <button
            type="button"
            onClick={() => updateRequest({ status: "Pending", archived: false })}
            className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white"
          >
            Reopen and Revert to Pending
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded bg-[#79d0df] px-3 py-1.5 text-sm text-white"
          >
            <FaPrint />
            Print
          </button>
          {request.status === "Pending" ? (
            <ActionButton
              label="Resolve"
              variant="success"
              loading={mutating}
              loadingLabel="Saving…"
              onClick={markResolved}
            />
          ) : null}
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
        {request.resolvedBy && (
          <span className="rounded bg-[#5cb85c] px-2 py-0.5 text-xs text-white">
            Resolved by {request.resolvedBy} on {request.resolvedAt}
          </span>
        )}
        <SeverityBadge severity={request.adminSeverity} />
        <span className="text-xs text-slate-500">High Severity</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div>
          <AdminSectionHeader title="Assignment & Users" />
          <div className="grid gap-3 p-3 sm:grid-cols-2">
            <ReadField label="Created By" value={request.createdBy} />
            <ReadField label="Date & Time" value={`${request.createdAt}`} />
            <SelectField label="Assigned To *" value={request.assignedTo} field="assignedTo" request={request} onSave={updateRequest} />
            <ReadField label="Resident" value={request.resident} />
            <ReadField label="Unit" value={request.unit} />
            <SelectField label="Who can view this Request *" value={request.visibility} field="visibility" request={request} onSave={updateRequest} />
          </div>
          {onViewRelated && request.unit && request.resident && (
            <div className="px-3 pb-2">
              <button
                type="button"
                onClick={() => onViewRelated(request.unit, request.resident)}
                className="text-sm font-medium text-[#3476ef] hover:underline"
              >
                View all requests for this unit & owner
              </button>
            </div>
          )}
        </div>
        <div className="rounded border border-slate-200 p-3 text-sm">
          <AdminSectionHeader title="PO's" color="orange" />
          <div className="space-y-2 p-3">
            <button
              type="button"
              onClick={handleGeneratePO}
              className="rounded bg-[#3476ef] px-3 py-1.5 text-xs text-white hover:bg-[#2d68cf]"
            >
              Generate PO
            </button>
            {relatedPOs.length === 0 ? (
              <p className="text-slate-500">There are no PO&apos;s for this request.</p>
            ) : (
              <ul className="space-y-1">
                {relatedPOs.map((po) => (
                  <li key={po.id} className="rounded bg-slate-50 px-2 py-1 text-slate-700">
                    {po.poNumber} - {po.status} - {po.createdAt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <AdminSectionHeader title="Location" />
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <ReadField label="Location" value={request.location} />
        <ReadField label="Contact Phone" value={request.contact} />
        <ReadField label="Permission to Enter" value={request.permissionToEnter} />
        <ReadField label="Permission to Enter Details" value={request.permissionNotes ?? ""} />
      </div>

      <AdminSectionHeader title="Request Details" />
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <SelectField label="Admin Severity" value={request.adminSeverity} field="adminSeverity" request={request} onSave={updateRequest} options={["Low", "Medium", "High", "Emergency"]} />
        <ReadField label="Resident Severity" value={request.severity} />
        <label className="text-sm">
          <span className="font-medium text-slate-700">Admin Category *</span>
          <select
            value={request.adminCategory}
            onChange={async (e) => {
              const nextCategory = e.target.value;
              if (nextCategory === "Other") {
                setRequest({ ...request, adminCategory: "Other" });
                return;
              }
              const resolved = await adminRepository.resolveServiceCategoryName(nextCategory);
              updateRequest({ adminCategory: resolved, category: resolved });
            }}
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1"
          >
            {categoryOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          {request.adminCategory === "Other" && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={customAdminCategory}
                onChange={(e) => setCustomAdminCategory(e.target.value)}
                placeholder="Type custom category"
                className="w-full rounded border border-slate-300 px-2 py-1"
              />
              <ActionButton
                label="Save Custom Category"
                className="px-3 py-1 text-xs"
                loading={mutating}
                onClick={async () => {
                  if (!customAdminCategory.trim()) {
                    alert("Please enter a custom category name.");
                    return;
                  }
                  const resolved = await adminRepository.resolveServiceCategoryName(
                    "Other",
                    customAdminCategory
                  );
                  setCustomAdminCategory("");
                  updateRequest({ adminCategory: resolved, category: resolved });
                }}
              />
            </div>
          )}
        </label>
        <ReadField label="Resident Category" value={request.category} />
      </div>
      <div className="p-3">
        <label className="text-sm font-medium text-slate-700">Request Details</label>
        <textarea
          readOnly
          value={request.description}
          rows={4}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 bg-slate-50"
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
          attachments={request.attachments}
          onRemove={(attachmentId) => void removeAttachment(attachmentId)}
        />
      </div>

      <CommentSection
        title="Scrollable Admin Comments"
        subtitle="(Visible to Admins ONLY)"
        comments={request.adminComments}
        adminOnly
        headerColor="orange"
        onAdd={(text) => addComment(text, "admin")}
      />

      <CommentSection
        title="Scrollable Comments"
        subtitle="(Visible to Resident & Admin)"
        comments={request.publicComments}
        headerColor="gray"
        onAdd={(text) => addComment(text, "public")}
      />
      <PurchaseOrderFormModal
        open={createPOOpen}
        prefill={poPrefill}
        onClose={() => setCreatePOOpen(false)}
        onSaved={refresh}
      />

      <ConfirmModal
        open={removeAttachmentOpen}
        onClose={() => {
          if (removingAttachment) return;
          setRemoveAttachmentOpen(false);
          pendingAttachmentIdRef.current = null;
        }}
        title="Remove Attachment"
        message="Remove this attachment?"
        variant="danger"
        loading={removingAttachment}
        onConfirm={() => void removeAttachmentRun()}
      />
    </Modal>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  field,
  request,
  onSave,
  options = ["All Admins", "Only Administrators", "All users in this unit"],
}: {
  label: string;
  value: string;
  field: keyof AdminServiceRequest;
  request: AdminServiceRequest;
  onSave: (updates: Partial<AdminServiceRequest>) => void;
  options?: string[];
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onSave({ [field]: e.target.value })}
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
