import { useEffect, useState } from "react";
import { FaPrint, FaWrench } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
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

  useEffect(() => {
    if (open && requestId) {
      adminRepository.getServiceRequestById(requestId).then(setRequest);
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

  if (!request) return null;

  const refresh = async () => {
    if (requestId) {
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
    }
  };

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
    new Set([
      ...serviceCategories,
      request.adminCategory,
    ].filter(Boolean))
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
            onClick={() => adminRepository.updateServiceRequest(request.id, { pendingReply: true }).then(refresh)}
            className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white"
          >
            Set as Unread
          </button>
          <button
            type="button"
            onClick={() =>
              adminRepository
                .updateServiceRequest(request.id, { status: "Pending", archived: false })
                .then(refresh)
            }
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
            <SelectField label="Assigned To *" value={request.assignedTo} field="assignedTo" request={request} onSave={refresh} />
            <ReadField label="Resident" value={request.resident} />
            <ReadField label="Unit" value={request.unit} />
            <SelectField label="Who can view this Request *" value={request.visibility} field="visibility" request={request} onSave={refresh} />
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
        <SelectField label="Admin Severity" value={request.adminSeverity} field="adminSeverity" request={request} onSave={refresh} options={["Low", "Medium", "High", "Emergency"]} />
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
              await adminRepository.updateServiceRequest(request.id, {
                adminCategory: resolved,
                category: resolved,
              });
              await refresh();
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
              <button
                type="button"
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
                  await adminRepository.updateServiceRequest(request.id, {
                    adminCategory: resolved,
                    category: resolved,
                  });
                  await refresh();
                }}
                className="rounded bg-[#3476ef] px-3 py-1 text-xs text-white"
              >
                Save Custom Category
              </button>
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
        action={<button type="button" className="rounded bg-white/20 px-2 py-0.5 text-xs">+ Add</button>}
      />
      <p className="p-3 text-sm text-slate-500">
        {request.attachments.length === 0 ? "No Files Attached" : request.attachments.join(", ")}
      </p>

      <CommentSection
        title="Scrollable Admin Comments"
        subtitle="(Visible to Admins ONLY)"
        comments={request.adminComments}
        adminOnly
        headerColor="orange"
        onAdd={(text) =>
          adminRepository
            .addServiceRequestComment(
              request.id,
              { author: "Scott Munday", text, createdAt: new Date().toLocaleString() },
              "admin"
            )
            .then(refresh)
        }
      />

      <CommentSection
        title="Scrollable Comments"
        subtitle="(Visible to Resident & Admin)"
        comments={request.publicComments}
        headerColor="gray"
        onAdd={(text) =>
          adminRepository
            .addServiceRequestComment(
              request.id,
              { author: "Scott Munday", text, createdAt: new Date().toLocaleString() },
              "public"
            )
            .then(refresh)
        }
      />
      <PurchaseOrderFormModal
        open={createPOOpen}
        prefill={poPrefill}
        onClose={() => setCreatePOOpen(false)}
        onSaved={refresh}
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
  onSave: () => void;
  options?: string[];
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) =>
          adminRepository.updateServiceRequest(request.id, { [field]: e.target.value }).then(onSave)
        }
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
