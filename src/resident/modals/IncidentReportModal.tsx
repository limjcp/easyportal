import { useEffect, useMemo, useState } from "react";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { SectionHeader } from "../../shared/SectionHeader";
import { FileUploadZone } from "../../shared/FileUploadZone";
import type { CreateIncidentReportInput } from "../data/types";
import { residentRepo } from "../data/mockRepository";

type IncidentReportModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateIncidentReportInput) => Promise<void>;
};

export function IncidentReportModal({ open, onClose, onSubmit }: IncidentReportModalProps) {
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [severity, setSeverity] = useState("");
  const [reportType, setReportType] = useState("");
  const [customReportType, setCustomReportType] = useState("");
  const [reportTypeOptions, setReportTypeOptions] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("All users in this unit can see this report");
  const [location, setLocation] = useState("Claudio - Unit 102");
  const [description, setDescription] = useState("");
  const [uploadSlots, setUploadSlots] = useState([1, 2, 3]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    residentRepo.getIncidentCategories().then((categories) => {
      const names = categories.map((category) => category.name);
      const withOther = names.some((name) => name === "Other") ? names : [...names, "Other"];
      setReportTypeOptions(withOther);
      if (reportType && !withOther.includes(reportType)) {
        setReportType("");
      }
    });
  }, [open, reportType]);

  useEffect(() => {
    if (reportType !== "Other") {
      setCustomReportType("");
    }
  }, [reportType]);

  const incidentTypeOptions = useMemo(() => ["", ...reportTypeOptions], [reportTypeOptions]);

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
    setSubmitting(true);
    await onSubmit({
      incidentDate,
      incidentTime,
      severity,
      reportType: resolvedType,
      visibility,
      location,
      description,
    });
    setSubmitting(false);
    onClose();
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
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
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
        <Field label="Incident Date *" type="date" value={incidentDate} onChange={setIncidentDate} />
        <Field label="Incident Time *" type="time" value={incidentTime} onChange={setIncidentTime} />
        <Select label="Severity *" value={severity} onChange={setSeverity} options={["", "Low", "Medium", "High"]} />
        <Select label="Incident Report Type *" value={reportType} onChange={setReportType} options={incidentTypeOptions} />
        <Select label="Who can view this report? *" value={visibility} onChange={setVisibility} options={[visibility]} />
        <Select label="Location *" value={location} onChange={setLocation} options={[location, "Common Area", "Parking"]} />
      </div>
      {reportType === "Other" && (
        <div className="mt-3">
          <Field
            label="Custom Incident Type *"
            type="text"
            value={customReportType}
            onChange={setCustomReportType}
          />
        </div>
      )}
      <div className="mt-3">
        <label className="text-sm font-medium text-slate-700">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Enter Description"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <SectionHeader
        title="File Attachments: (5mb max/file - Special characters will be removed on upload)"
        action={
          <button type="button" onClick={() => setUploadSlots((s) => [...s, s.length + 1])} className="rounded bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30">
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

function Field({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
        {options.map((o) => (
          <option key={o} value={o}>{o || "Select..."}</option>
        ))}
      </select>
    </div>
  );
}
