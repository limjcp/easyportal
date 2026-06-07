import { useEffect, useMemo, useState } from "react";
import { FaPaperPlane, FaWrench } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { SectionHeader } from "../../shared/SectionHeader";
import { FileUploadZone } from "../../shared/FileUploadZone";
import { validateAttachmentFile } from "../../shared/attachmentUtils";
import type { CreateServiceRequestInput } from "../data/types";
import { residentRepo } from "../data/mockRepository";

const DEFAULT_VISIBILITY = "All users in this unit can see this request";
const LOCATION_OPTIONS = ["Common Area"];

type ServiceRequestModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateServiceRequestInput) => Promise<void>;
};

const initialFormState = () => ({
  contact: "",
  location: "",
  visibility: DEFAULT_VISIBILITY,
  permissionToEnter: "",
  permissionNotes: "",
  severity: "",
  category: "",
  customCategory: "",
  description: "",
  createdBy: "",
  uploadSlots: [1, 2, 3] as number[],
});

export function ServiceRequestModal({ open, onClose, onSubmit }: ServiceRequestModalProps) {
  const [form, setForm] = useState(initialFormState);
  const [slotFiles, setSlotFiles] = useState<Record<number, File>>({});
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    contact,
    location,
    visibility,
    permissionToEnter,
    permissionNotes,
    severity,
    category,
    customCategory,
    description,
    createdBy,
    uploadSlots,
  } = form;

  useEffect(() => {
    if (!open) {
      setForm(initialFormState());
      setSlotFiles({});
      return;
    }

    residentRepo.getUser().then((user) => {
      const defaultLocation =
        user.unit && user.name ? `${user.name} - ${user.unit}` : user.unit || user.name || "";
      const createdByLabel =
        user.name && user.role ? `${user.name} - ${user.role}` : user.name || user.role || "";
      setForm({
        ...initialFormState(),
        location: defaultLocation,
        visibility: DEFAULT_VISIBILITY,
        createdBy: createdByLabel,
      });
    });

    residentRepo.getServiceCategories().then((categories) => {
      const names = categories.map((categoryItem) => categoryItem.name);
      const withOther = names.some((name) => name === "Other") ? names : [...names, "Other"];
      setCategoryOptions(withOther);
    });
  }, [open]);

  useEffect(() => {
    if (category !== "Other") {
      setForm((current) => ({ ...current, customCategory: "" }));
    }
  }, [category]);

  const serviceCategoryOptions = useMemo(() => ["", ...categoryOptions], [categoryOptions]);

  const locationOptions = useMemo(() => {
    const options = location ? [location, ...LOCATION_OPTIONS] : LOCATION_OPTIONS;
    return Array.from(new Set(options));
  }, [location]);

  const handleSubmit = async () => {
    if (!contact || !permissionToEnter || !severity || !category || !description) {
      alert("Please fill in all required fields.");
      return;
    }
    const resolvedCategory = category === "Other" ? customCategory.trim() : category;
    if (!resolvedCategory) {
      alert("Please enter a custom category name.");
      return;
    }
    const files = Object.values(slotFiles);
    for (const file of files) {
      const error = validateAttachmentFile(file);
      if (error) {
        alert(error);
        return;
      }
    }
    setSubmitting(true);
    try {
      await onSubmit({
        contact,
        location,
        visibility,
        permissionToEnter,
        permissionNotes,
        severity,
        category: resolvedCategory,
        description,
        files: files.length ? files : undefined,
      });
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit service request.");
    } finally {
      setSubmitting(false);
    }
  };

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a Service Request"
      icon={<FaWrench className="text-[#3476ef]" />}
      size="xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf] disabled:opacity-50"
          >
            Submit Request
            <FaPaperPlane />
          </button>
        </>
      }
    >
      <SectionHeader title="Request Details" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <FormField label="Created By" value={createdBy} readOnly />
        <FormField label="Date" value={dateStr} readOnly />
        <FormField label="Time" value={timeStr} readOnly />
        <SelectField label="Who can view this Request? *" value={visibility} onChange={(v) => setForm((c) => ({ ...c, visibility: v }))} options={[DEFAULT_VISIBILITY]} />
        <InputField label="Contact # *" value={contact} onChange={(v) => setForm((c) => ({ ...c, contact: v }))} placeholder="Enter Phone" />
        <SelectField label="Location *" value={location} onChange={(v) => setForm((c) => ({ ...c, location: v }))} options={locationOptions} />
        <SelectField
          label="Permission To Enter *"
          value={permissionToEnter}
          onChange={(v) => setForm((c) => ({ ...c, permissionToEnter: v }))}
          options={["", "Yes", "No", "Call first"]}
        />
        <InputField label="Permission To Enter notes" value={permissionNotes} onChange={(v) => setForm((c) => ({ ...c, permissionNotes: v }))} placeholder="Please call ahead, etc." />
      </div>

      <SectionHeader title="Request Description" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <SelectField label="Severity *" value={severity} onChange={(v) => setForm((c) => ({ ...c, severity: v }))} options={["", "Low", "Medium", "High", "Emergency"]} />
        <SelectField label="Request Category *" value={category} onChange={(v) => setForm((c) => ({ ...c, category: v }))} options={serviceCategoryOptions} />
      </div>
      {category === "Other" && (
        <div className="mt-3">
          <InputField
            label="Custom Category *"
            value={customCategory}
            onChange={(v) => setForm((c) => ({ ...c, customCategory: v }))}
            placeholder="Type custom category"
          />
        </div>
      )}
      <div className="mt-3">
        <label className="text-sm font-medium text-slate-700">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
          rows={4}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Describe the issue..."
        />
      </div>

      <SectionHeader
        title="File Attachments: (5mb max/file - Special characters will be removed on upload)"
        action={
          <button
            type="button"
            onClick={() => setForm((c) => ({ ...c, uploadSlots: [...c.uploadSlots, c.uploadSlots.length + 1] }))}
            className="rounded bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30"
          >
            + Add More
          </button>
        }
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {uploadSlots.map((id) => (
          <FileUploadZone
            key={id}
            onFileSelect={(file) => {
              setSlotFiles((current) => {
                const next = { ...current };
                if (file) next[id] = file;
                else delete next[id];
                return next;
              });
            }}
            onRemove={
              uploadSlots.length > 1
                ? () => {
                    setForm((c) => ({ ...c, uploadSlots: c.uploadSlots.filter((x) => x !== id) }));
                    setSlotFiles((current) => {
                      const next = { ...current };
                      delete next[id];
                      return next;
                    });
                  }
                : undefined
            }
          />
        ))}
      </div>
    </Modal>
  );
}

function FormField({ label, value, readOnly }: { label: string; value: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input readOnly={readOnly} value={value} className="mt-1 w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "Select..."}
          </option>
        ))}
      </select>
    </div>
  );
}
