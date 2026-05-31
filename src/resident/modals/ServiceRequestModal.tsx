import { useEffect, useMemo, useState } from "react";
import { FaPaperPlane, FaWrench } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { SectionHeader } from "../../shared/SectionHeader";
import { FileUploadZone } from "../../shared/FileUploadZone";
import type { CreateServiceRequestInput } from "../data/types";
import { residentRepo } from "../data/mockRepository";

type ServiceRequestModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateServiceRequestInput) => Promise<void>;
};

export function ServiceRequestModal({ open, onClose, onSubmit }: ServiceRequestModalProps) {
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("Claudio - Unit 102");
  const [visibility, setVisibility] = useState("All users in this unit can see this request");
  const [permissionToEnter, setPermissionToEnter] = useState("");
  const [permissionNotes, setPermissionNotes] = useState("");
  const [severity, setSeverity] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [uploadSlots, setUploadSlots] = useState([1, 2, 3]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    residentRepo.getServiceCategories().then((categories) => {
      const names = categories.map((categoryItem) => categoryItem.name);
      const withOther = names.some((name) => name === "Other") ? names : [...names, "Other"];
      setCategoryOptions(withOther);
      if (category && !withOther.includes(category)) {
        setCategory("");
      }
    });
  }, [open, category]);

  useEffect(() => {
    if (category !== "Other") {
      setCustomCategory("");
    }
  }, [category]);

  const serviceCategoryOptions = useMemo(() => ["", ...categoryOptions], [categoryOptions]);

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
    setSubmitting(true);
    await onSubmit({
      contact,
      location,
      visibility,
      permissionToEnter,
      permissionNotes,
      severity,
      category: resolvedCategory,
      description,
    });
    setSubmitting(false);
    onClose();
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
        <FormField label="Created By" value="Claudio Owner - Board 5" readOnly />
        <FormField label="Date" value={dateStr} readOnly />
        <FormField label="Time" value={timeStr} readOnly />
        <SelectField label="Who can view this Request? *" value={visibility} onChange={setVisibility} options={[visibility]} />
        <InputField label="Contact # *" value={contact} onChange={setContact} placeholder="Enter Phone" />
        <SelectField label="Location *" value={location} onChange={setLocation} options={[location, "Common Area"]} />
        <SelectField
          label="Permission To Enter *"
          value={permissionToEnter}
          onChange={setPermissionToEnter}
          options={["", "Yes", "No", "Call first"]}
        />
        <InputField label="Permission To Enter notes" value={permissionNotes} onChange={setPermissionNotes} placeholder="Please call ahead, etc." />
      </div>

      <SectionHeader title="Request Description" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <SelectField label="Severity *" value={severity} onChange={setSeverity} options={["", "Low", "Medium", "High", "Emergency"]} />
        <SelectField label="Request Category *" value={category} onChange={setCategory} options={serviceCategoryOptions} />
      </div>
      {category === "Other" && (
        <div className="mt-3">
          <InputField
            label="Custom Category *"
            value={customCategory}
            onChange={setCustomCategory}
            placeholder="Type custom category"
          />
        </div>
      )}
      <div className="mt-3">
        <label className="text-sm font-medium text-slate-700">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
            onClick={() => setUploadSlots((s) => [...s, s.length + 1])}
            className="rounded bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30"
          >
            + Add More
          </button>
        }
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {uploadSlots.map((id) => (
          <FileUploadZone key={id} onRemove={uploadSlots.length > 1 ? () => setUploadSlots((s) => s.filter((x) => x !== id)) : undefined} />
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
