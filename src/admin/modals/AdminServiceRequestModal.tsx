import { useEffect, useMemo, useState } from "react";
import { FaPaperPlane, FaWrench } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { FileUploadZone } from "../../shared/FileUploadZone";
import { AdminSectionHeader } from "../components/CommentSection";
import { adminRepository } from "../data/adminRepository";
import { validateAttachmentFile } from "../../shared/attachmentUtils";
import type { CreateAdminServiceRequestInput, ServiceRequestCategory } from "../../resident/data/types";

type AdminServiceRequestModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateAdminServiceRequestInput) => Promise<void>;
};

export function AdminServiceRequestModal({
  open,
  onClose,
  onSubmit,
}: AdminServiceRequestModalProps) {
  const [assignedTo, setAssignedTo] = useState("All Admins");
  const [resident, setResident] = useState("");
  const [visibility, setVisibility] = useState("Only Administrators");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [permissionToEnter, setPermissionToEnter] = useState("");
  const [permissionNotes, setPermissionNotes] = useState("");
  const [severity, setSeverity] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [categories, setCategories] = useState<ServiceRequestCategory[]>([]);
  const [description, setDescription] = useState("");
  const [uploadSlots, setUploadSlots] = useState([1, 2, 3]);
  const [slotFiles, setSlotFiles] = useState<Record<number, File>>({});
  const [residentOptions, setResidentOptions] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);

  const derivedUnit = resident.match(/(Unit\s*\d+)/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";

  useEffect(() => {
    if (!open) {
      setAssignedTo("All Admins");
      setResident("");
      setVisibility("Only Administrators");
      setLocation("");
      setContact("");
      setPermissionToEnter("");
      setPermissionNotes("");
      setSeverity("");
      setCategory("");
      setCustomCategory("");
      setDescription("");
      setUploadSlots([1, 2, 3]);
      setSlotFiles({});
      return;
    }
    adminRepository.getUnitsUsersCurrent().then((rows) => {
      const options = rows
        .map((row) => `${row.unitLabel} - ${row.name}`)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setResidentOptions(["", ...options]);
    });
    adminRepository.getServiceCategories().then((items) => {
      const active = items.filter((item) => item.status === "active");
      setCategories(active);
      if (category && !active.some((item) => item.name === category)) {
        setCategory("");
      }
    });
  }, [open, category]);

  useEffect(() => {
    if (category !== "Other") {
      setCustomCategory("");
    }
  }, [category]);

  const categoryOptions = useMemo(() => {
    const names = categories.map((categoryItem) => categoryItem.name);
    const withOther = names.some((name) => name === "Other") ? names : [...names, "Other"];
    return ["", ...withOther];
  }, [categories]);

  const handleSubmit = async () => {
    if (!resident || !location || !permissionToEnter || !severity || !category || !description) {
      alert("Please fill in all required fields.");
      return;
    }
    if (category === "Other" && !customCategory.trim()) {
      alert("Please enter a custom category name.");
      return;
    }
    const resolvedCategory = category === "Other" ? customCategory.trim() : category;
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
        assignedTo,
        resident,
        unit: derivedUnit || undefined,
        visibility,
        contact,
        location,
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a Service Request"
      icon={<FaWrench className="text-[#e8913a]" />}
      size="xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="text-sm text-slate-600">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded bg-[#e8913a] px-4 py-2 text-sm font-medium text-white hover:bg-[#d8822f] disabled:opacity-50"
          >
            Submit Request
            <FaPaperPlane />
          </button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <AdminSectionHeader title="Request Assignment & Users" />
          <div className="space-y-3 p-3">
            <SelectField label="Assign To *" value={assignedTo} onChange={setAssignedTo} options={["All Admins"]} />
            <SelectField
              label="Resident *"
              value={resident}
              onChange={setResident}
              options={residentOptions}
            />
            <SelectField
              label="Show Request to *"
              value={visibility}
              onChange={setVisibility}
              options={["Only Administrators", "All users in this unit"]}
            />
          </div>
        </div>
        <div>
          <AdminSectionHeader title="Request Location" />
          <div className="space-y-3 p-3">
            <InputField label="Location *" value={location} onChange={setLocation} placeholder="Location" />
            <InputField label="Contact Phone" value={contact} onChange={setContact} placeholder="Enter Phone" />
            <SelectField
              label="Permission To Enter *"
              value={permissionToEnter}
              onChange={setPermissionToEnter}
              options={["", "Yes", "No", "Call first"]}
            />
            <InputField
              label="Permission To Enter notes"
              value={permissionNotes}
              onChange={setPermissionNotes}
              placeholder="Please call ahead, etc"
            />
          </div>
        </div>
      </div>

      <AdminSectionHeader title="Request Details" />
      <div className="space-y-3 p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Severity *"
            value={severity}
            onChange={setSeverity}
            options={["", "Low", "Medium", "High", "Emergency"]}
          />
          <SelectField
            label="Request Category *"
            value={category}
            onChange={setCategory}
            options={categoryOptions}
          />
        </div>
        {category === "Other" && (
          <InputField
            label="Custom Category *"
            value={customCategory}
            onChange={setCustomCategory}
            placeholder="Type custom category"
          />
        )}
        <label className="block text-sm font-medium text-slate-700">
          Description *
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Enter description"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
      </div>

      <AdminSectionHeader
        title="File Attachments"
        action={
          <button
            type="button"
            onClick={() => setUploadSlots((s) => [...s, s.length + 1])}
            className="rounded bg-white/20 px-2 py-0.5 text-xs"
          >
            + Add More
          </button>
        }
      />
      <p className="px-3 pt-2 text-xs text-slate-500">
        (5mb max/file - Special characters will be removed on upload)
      </p>
      <div className="grid gap-3 p-3 sm:grid-cols-3">
        {uploadSlots.map((slot) => (
          <FileUploadZone
            key={slot}
            onFileSelect={(file) => {
              setSlotFiles((current) => {
                const next = { ...current };
                if (file) next[slot] = file;
                else delete next[slot];
                return next;
              });
            }}
            onRemove={
              uploadSlots.length > 1
                ? () => {
                    setUploadSlots((s) => s.filter((x) => x !== slot));
                    setSlotFiles((current) => {
                      const next = { ...current };
                      delete next[slot];
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
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "Select..."}
          </option>
        ))}
      </select>
    </label>
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
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
      />
    </label>
  );
}
