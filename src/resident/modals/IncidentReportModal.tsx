import { useEffect, useMemo, useState } from "react";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { SectionHeader } from "../../shared/SectionHeader";
import { FileUploadZone } from "../../shared/FileUploadZone";
import { validateAttachmentFile } from "../../shared/attachmentUtils";
import type { CreateIncidentReportInput } from "../data/types";
import { residentRepo } from "../data/mockRepository";

const DEFAULT_VISIBILITY = "All users in this unit can see this report";
const LOCATION_OPTIONS = ["Common Area", "Parking"];

type IncidentReportModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateIncidentReportInput) => Promise<void>;
};

const initialFormState = () => ({
  incidentDate: "",
  incidentTime: "",
  severity: "",
  reportType: "",
  customReportType: "",
  visibility: DEFAULT_VISIBILITY,
  location: "",
  description: "",
  uploadSlots: [1, 2, 3] as number[],
});

export function IncidentReportModal({ open, onClose, onSubmit }: IncidentReportModalProps) {
  const [form, setForm] = useState(initialFormState);
  const [slotFiles, setSlotFiles] = useState<Record<number, File>>({});
  const [reportTypeOptions, setReportTypeOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    incidentDate,
    incidentTime,
    severity,
    reportType,
    customReportType,
    visibility,
    location,
    description,
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
      setForm((current) => ({
        ...initialFormState(),
        location: defaultLocation,
        visibility: DEFAULT_VISIBILITY,
      }));
    });

    residentRepo.getIncidentCategories().then((categories) => {
      const names = categories.map((category) => category.name);
      const withOther = names.some((name) => name === "Other") ? names : [...names, "Other"];
      setReportTypeOptions(withOther);
    });
  }, [open]);

  useEffect(() => {
    if (reportType !== "Other") {
      setForm((current) => ({ ...current, customReportType: "" }));
    }
  }, [reportType]);

  const incidentTypeOptions = useMemo(() => ["", ...reportTypeOptions], [reportTypeOptions]);

  const locationOptions = useMemo(() => {
    const options = location ? [location, ...LOCATION_OPTIONS] : LOCATION_OPTIONS;
    return Array.from(new Set(options));
  }, [location]);

  const handleSubmit = async () => {
    if (!incidentDate || !incidentTime || !severity || !reportType || !description) {
      alert("Please fill in all required fields.");
      return;
    }
    const resolvedType = reportType === "Other" ? customReportType.trim() : reportType;
    if (!resolvedType) {
      alert("Please enter a custom incident type.");
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
        incidentDate,
        incidentTime,
        severity,
        reportType: resolvedType,
        visibility,
        location,
        description,
        files: files.length ? files : undefined,
      });
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit incident report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Incident Report"
      icon={<FaExclamationTriangle className="text-[#3476ef]" />}
      size="xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm text-black hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf] disabled:opacity-50"
          >
            Submit For Review
            <FaInfoCircle />
          </button>
        </>
      }
    >
      <SectionHeader title="Incident Report Details" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Incident Date *" type="date" value={incidentDate} onChange={(value) => setForm((current) => ({ ...current, incidentDate: value }))} />
        <Field label="Incident Time *" type="time" value={incidentTime} onChange={(value) => setForm((current) => ({ ...current, incidentTime: value }))} />
        <Select label="Severity *" value={severity} onChange={(value) => setForm((current) => ({ ...current, severity: value }))} options={["", "Low", "Medium", "High"]} />
        <Select label="Incident Report Type *" value={reportType} onChange={(value) => setForm((current) => ({ ...current, reportType: value }))} options={incidentTypeOptions} />
        <Select label="Who can view this report? *" value={visibility} onChange={(value) => setForm((current) => ({ ...current, visibility: value }))} options={[DEFAULT_VISIBILITY]} />
        <Select label="Location *" value={location} onChange={(value) => setForm((current) => ({ ...current, location: value }))} options={locationOptions} />
      </div>
      {reportType === "Other" && (
        <div className="mt-3">
          <Field
            label="Custom Incident Type *"
            type="text"
            value={customReportType}
            onChange={(value) => setForm((current) => ({ ...current, customReportType: value }))}
          />
        </div>
      )}
      <div className="mt-3">
        <label className="text-sm font-medium text-slate-700">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
          rows={4}
          placeholder="Enter Description"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-black"
        />
      </div>
      <SectionHeader
        title="File Attachments: (5mb max/file - Special characters will be removed on upload)"
        action={
          <button type="button" onClick={() => setForm((current) => ({ ...current, uploadSlots: [...current.uploadSlots, current.uploadSlots.length + 1] }))} className="rounded bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30">
            + Add More
          </button>
        }
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {uploadSlots.map((id) => (
          <div key={id}>
            <FileUploadZone
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
                      setForm((current) => ({
                        ...current,
                        uploadSlots: current.uploadSlots.filter((x) => x !== id),
                      }));
                      setSlotFiles((current) => {
                        const next = { ...current };
                        delete next[id];
                        return next;
                      });
                    }
                  : () => {
                      setSlotFiles((current) => {
                        const next = { ...current };
                        delete next[id];
                        return next;
                      });
                    }
              }
            />
            {slotFiles[id] ? (
              <p className="mt-1 truncate text-xs text-black">{slotFiles[id].name}</p>
            ) : null}
          </div>
        ))}
      </div>
    </Modal>
  );
}

function Field({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-black" />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-black">
        {options.map((o) => (
          <option key={o} value={o}>{o || "Select..."}</option>
        ))}
      </select>
    </div>
  );
}
