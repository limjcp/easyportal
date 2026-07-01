import { useCallback, useEffect, useMemo, useState } from "react";
import { FaWrench } from "react-icons/fa";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { Modal } from "../../shared/Modal";
import { SectionHeader } from "../../shared/SectionHeader";
import { FileUploadZone } from "../../shared/FileUploadZone";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { validateAttachmentFile } from "../../shared/attachmentUtils";
import {
  mergeServiceCategoryOptions,
  mergeServiceLocationOptions,
  resolveServiceRequestLocation,
  SERVICE_REQUEST_SEVERITY_OPTIONS,
  isEmergencyServiceRequestSeverity,
  EMERGENCY_SEVERITY_SUBMIT_ERROR,
} from "../../shared/serviceRequestPresets";
import {
  EmergencySeverityInlineNotice,
  EmergencySeverityNoticeModal,
} from "../../shared/EmergencySeverityNotice";
import type { CreateServiceRequestInput } from "../data/types";
import { residentRepo } from "../data/residentRepository";

const DEFAULT_VISIBILITY = "All users in this unit can see this request";

type ServiceRequestModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateServiceRequestInput) => Promise<void>;
};

const initialFormState = () => ({
  contact: "",
  location: "",
  customLocation: "",
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
  const [dbCategoryNames, setDbCategoryNames] = useState<string[]>([]);
  const [buildingCommonAreas, setBuildingCommonAreas] = useState<string[]>([]);
  const [defaultUnitLocation, setDefaultUnitLocation] = useState("");
  const [emergencyNoticeOpen, setEmergencyNoticeOpen] = useState(false);

  const {
    contact,
    location,
    customLocation,
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
      setDbCategoryNames([]);
      setBuildingCommonAreas([]);
      setDefaultUnitLocation("");
      setEmergencyNoticeOpen(false);
      return;
    }

    residentRepo.getUser().then((user) => {
      const unitLocation =
        user.unit && user.name ? `${user.name} - ${user.unit}` : user.unit || user.name || "";
      const createdByLabel =
        user.name && user.role ? `${user.name} - ${user.role}` : user.name || user.role || "";
      setDefaultUnitLocation(unitLocation);
      setForm({
        ...initialFormState(),
        location: unitLocation,
        visibility: DEFAULT_VISIBILITY,
        createdBy: createdByLabel,
      });
    });

    residentRepo.getServiceCategories().then((categories) => {
      setDbCategoryNames(categories.map((categoryItem) => categoryItem.name));
    });

    residentRepo.getBuildingCommonAreas().then(setBuildingCommonAreas);
  }, [open]);

  useEffect(() => {
    if (category !== "Other") {
      setForm((current) => ({ ...current, customCategory: "" }));
    }
  }, [category]);

  useEffect(() => {
    if (location !== "Other") {
      setForm((current) => ({ ...current, customLocation: "" }));
    }
  }, [location]);

  useEffect(() => {
    if (severity === "Emergency") {
      setEmergencyNoticeOpen(true);
    }
  }, [severity]);

  const serviceCategoryOptions = useMemo(
    () => ["", ...mergeServiceCategoryOptions(dbCategoryNames)],
    [dbCategoryNames]
  );

  const locationOptions = useMemo(
    () => ["", ...mergeServiceLocationOptions(buildingCommonAreas, defaultUnitLocation || undefined)],
    [buildingCommonAreas, defaultUnitLocation]
  );

  const { run: submitRequest, loading: submitting, error, clearError, setError } = useAsyncAction(
    useCallback(async () => {
      if (isEmergencyServiceRequestSeverity(severity)) {
        throw new Error(EMERGENCY_SEVERITY_SUBMIT_ERROR);
      }
      const resolvedCategory = category === "Other" ? customCategory.trim() : category;
      const resolvedLocation = resolveServiceRequestLocation(location, customLocation);
      const files = Object.values(slotFiles);
      await onSubmit({
        contact,
        location: resolvedLocation,
        visibility,
        permissionToEnter,
        permissionNotes,
        severity,
        category: resolvedCategory,
        description,
        files: files.length ? files : undefined,
      });
      onClose();
    }, [
      category,
      contact,
      customCategory,
      customLocation,
      description,
      location,
      onClose,
      onSubmit,
      permissionNotes,
      permissionToEnter,
      severity,
      slotFiles,
      visibility,
    ]),
    {
      successMessage: "Service request submitted.",
      errorMessage: "Failed to submit service request.",
    }
  );

  const handleSubmit = async () => {
    clearError();
    if (isEmergencyServiceRequestSeverity(severity)) {
      setError(EMERGENCY_SEVERITY_SUBMIT_ERROR);
      return;
    }
    const resolvedLocation = resolveServiceRequestLocation(location, customLocation);
    const resolvedCategory = category === "Other" ? customCategory.trim() : category;
    if (!contact || !resolvedLocation || !permissionToEnter || !severity || !category || !description) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!resolvedCategory) {
      setError("Please enter a custom category name.");
      return;
    }
    const files = Object.values(slotFiles);
    for (const file of files) {
      const attachmentError = validateAttachmentFile(file);
      if (attachmentError) {
        setError(attachmentError);
        return;
      }
    }
    await submitRequest();
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
          <ActionButton
            label="Submit Request"
            loadingLabel="Submitting…"
            loading={submitting}
            disabled={isEmergencyServiceRequestSeverity(severity)}
            onClick={() => void handleSubmit()}
          />
        </>
      }
    >
      {error ? <FormAlert message={error} className="mb-3" /> : null}
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
      {location === "Other" && (
        <div className="mt-3">
          <InputField
            label="Custom Location *"
            value={customLocation}
            onChange={(v) => setForm((c) => ({ ...c, customLocation: v }))}
            placeholder="Type custom location"
          />
        </div>
      )}

      <SectionHeader title="Request Description" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Severity *"
          value={severity}
          onChange={(v) => setForm((c) => ({ ...c, severity: v }))}
          options={[...SERVICE_REQUEST_SEVERITY_OPTIONS]}
        />
        <SelectField label="Request Category *" value={category} onChange={(v) => setForm((c) => ({ ...c, category: v }))} options={serviceCategoryOptions} />
      </div>
      {isEmergencyServiceRequestSeverity(severity) ? (
        <EmergencySeverityInlineNotice className="mt-3" />
      ) : null}
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

      <EmergencySeverityNoticeModal
        open={emergencyNoticeOpen}
        onClose={() => setEmergencyNoticeOpen(false)}
      />
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
