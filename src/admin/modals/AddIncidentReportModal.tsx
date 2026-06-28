import { useCallback, useEffect, useMemo, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FileUploadZone } from "../../shared/FileUploadZone";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { validateAttachmentFile } from "../../shared/attachmentUtils";
import {
  DEFAULT_ADMIN_INCIDENT_VISIBILITY,
  INCIDENT_ASSIGNED_TO_OPTIONS,
  INCIDENT_SEVERITY_OPTIONS,
  INCIDENT_VISIBILITY_OPTIONS,
  mergeIncidentCategoryOptions,
  mergeIncidentLocationOptions,
  OTHER_OPTION,
  resolveIncidentReportLocation,
} from "../../shared/incidentReportPresets";
import { AdminSectionHeader } from "../components/CommentSection";
import { adminRepository } from "../data/adminRepository";
import type { CreateAdminIncidentReportInput } from "../../resident/data/types";

type AddIncidentReportModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateAdminIncidentReportInput) => Promise<void>;
};

export function AddIncidentReportModal({ open, onClose, onSubmit }: AddIncidentReportModalProps) {
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [severity, setSeverity] = useState("");
  const [reportType, setReportType] = useState("");
  const [customReportType, setCustomReportType] = useState("");
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [visibility, setVisibility] = useState(DEFAULT_ADMIN_INCIDENT_VISIBILITY);
  const [assignedToAdmin, setAssignedToAdmin] = useState("All Admins");
  const [status, setStatus] = useState<"Draft" | "Pending" | "Resolved">("Pending");
  const [dbCategoryNames, setDbCategoryNames] = useState<string[]>([]);
  const [buildingCommonAreas, setBuildingCommonAreas] = useState<string[]>([]);
  const [uploadSlots, setUploadSlots] = useState([1, 2, 3]);
  const [slotFiles, setSlotFiles] = useState<Record<number, File>>({});

  const reset = () => {
    setIncidentDate("");
    setIncidentTime("");
    setSeverity("");
    setReportType("");
    setCustomReportType("");
    setLocation("");
    setCustomLocation("");
    setDescription("");
    setUnit("");
    setVisibility(DEFAULT_ADMIN_INCIDENT_VISIBILITY);
    setAssignedToAdmin("All Admins");
    setStatus("Pending");
    setDbCategoryNames([]);
    setBuildingCommonAreas([]);
    setUploadSlots([1, 2, 3]);
    setSlotFiles({});
  };

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    adminRepository.getIncidentCategories().then((cats) => {
      const active = cats.filter((c) => c.status === "active");
      setDbCategoryNames(active.map((c) => c.name));
    });
    adminRepository.getBuildingDefinition().then((definition) => {
      setBuildingCommonAreas(definition.commonAreas);
    });
  }, [open]);

  useEffect(() => {
    if (reportType !== OTHER_OPTION) {
      setCustomReportType("");
    }
  }, [reportType]);

  useEffect(() => {
    if (location !== OTHER_OPTION) {
      setCustomLocation("");
    }
  }, [location]);

  const incidentTypeOptions = useMemo(
    () => ["", ...mergeIncidentCategoryOptions(dbCategoryNames)],
    [dbCategoryNames]
  );

  const locationOptions = useMemo(
    () => ["", ...mergeIncidentLocationOptions(buildingCommonAreas, unit.trim() || undefined)],
    [buildingCommonAreas, unit]
  );

  const { run: submitReport, loading, error, setError, clearError } = useAsyncAction(
    useCallback(async () => {
      const resolvedLocation = resolveIncidentReportLocation(location, customLocation);
      const resolvedType = reportType === OTHER_OPTION ? customReportType.trim() : reportType;
      await onSubmit({
        incidentDate: incidentDate.trim(),
        incidentTime: incidentTime.trim(),
        severity,
        reportType: resolvedType,
        location: resolvedLocation,
        description: description.trim(),
        visibility,
        status,
        unit: unit.trim() || undefined,
        assignedToAdmin: assignedToAdmin.trim() || undefined,
        files: Object.values(slotFiles).length ? Object.values(slotFiles) : undefined,
      });
      reset();
      onClose();
    }, [
      customLocation,
      customReportType,
      description,
      incidentDate,
      incidentTime,
      location,
      onClose,
      onSubmit,
      reportType,
      severity,
      slotFiles,
      status,
      unit,
      assignedToAdmin,
      visibility,
    ]),
    { successMessage: "Incident report saved.", showErrorToast: false }
  );

  const handleSubmit = async () => {
    clearError();
    const resolvedLocation = resolveIncidentReportLocation(location, customLocation);
    const resolvedType = reportType === OTHER_OPTION ? customReportType.trim() : reportType;
    if (!incidentDate.trim() || !incidentTime.trim() || !severity || !reportType || !resolvedLocation || !description.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!resolvedType) {
      setError("Please enter a custom incident type.");
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
    await submitReport();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add an Incident Report"
      icon={<FaExclamationTriangle className="text-red-600" />}
      size="xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <ActionButton
            label="Save"
            loadingLabel="Saving…"
            loading={loading}
            variant="danger"
            onClick={() => void handleSubmit()}
          />
        </>
      }
    >
      {error ? <FormAlert message={error} className="mb-3" /> : null}

      <AdminSectionHeader title="Assignment & Users" />
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <SelectField
          label="Assigned to Admin *"
          value={assignedToAdmin}
          onChange={setAssignedToAdmin}
          options={[...INCIDENT_ASSIGNED_TO_OPTIONS]}
        />
        <SelectField
          label="Who can view this report? *"
          value={visibility}
          onChange={setVisibility}
          options={[...INCIDENT_VISIBILITY_OPTIONS]}
        />
        <InputField label="Unit" value={unit} onChange={setUnit} placeholder="e.g. Unit 53" />
        <SelectField
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as typeof status)}
          options={["Draft", "Pending", "Resolved"]}
        />
      </div>

      <AdminSectionHeader title="Incident Report Details" color="blue" />
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <DateField label="Incident Date *" value={incidentDate} onChange={setIncidentDate} />
        <TimeField label="Incident Time *" value={incidentTime} onChange={setIncidentTime} />
        <SelectField
          label="Severity *"
          value={severity}
          onChange={setSeverity}
          options={[...INCIDENT_SEVERITY_OPTIONS]}
        />
        <SelectField
          label="Incident Report Type *"
          value={reportType}
          onChange={setReportType}
          options={incidentTypeOptions}
        />
        <SelectField
          label="Location *"
          value={location}
          onChange={setLocation}
          options={locationOptions}
        />
        {location === OTHER_OPTION && (
          <InputField
            label="Custom Location *"
            value={customLocation}
            onChange={setCustomLocation}
            placeholder="Type custom location"
          />
        )}
      </div>
      {reportType === OTHER_OPTION && (
        <div className="px-3 pb-3">
          <InputField
            label="Custom Incident Type *"
            value={customReportType}
            onChange={setCustomReportType}
            placeholder="Type custom incident type"
          />
        </div>
      )}
      <div className="px-3 pb-3">
        <label className="block text-sm font-medium text-slate-700">
          Description *
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Enter Description"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
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
        className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
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
        className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
      />
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
      />
    </label>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type="time"
        step={60}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
      />
    </label>
  );
}
