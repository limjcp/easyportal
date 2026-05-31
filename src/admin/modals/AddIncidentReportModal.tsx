import { useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { adminRepository } from "../data/adminRepository";
import type { CreateAdminIncidentReportInput, IncidentReportCategory } from "../../resident/data/types";

type AddIncidentReportModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateAdminIncidentReportInput) => void;
};

export function AddIncidentReportModal({ open, onClose, onSubmit }: AddIncidentReportModalProps) {
  const [categories, setCategories] = useState<IncidentReportCategory[]>([]);
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [reportType, setReportType] = useState("");
  const [customReportType, setCustomReportType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [assignedToAdmin, setAssignedToAdmin] = useState("All Admins");
  const [status, setStatus] = useState<"Draft" | "Pending" | "Resolved">("Pending");

  useEffect(() => {
    if (!open) return;
    adminRepository.getIncidentCategories().then((cats) => {
      const active = cats.filter((c) => c.status === "active");
      setCategories(active);
      setReportType((prev) => prev || active[0]?.name || "");
    });
  }, [open]);

  const reset = () => {
    setIncidentDate("");
    setIncidentTime("");
    setSeverity("Medium");
    setReportType("");
    setCustomReportType("");
    setLocation("");
    setDescription("");
    setUnit("");
    setAssignedToAdmin("All Admins");
    setStatus("Pending");
  };

  const handleSubmit = () => {
    if (!incidentDate.trim() || !reportType || !location.trim() || !description.trim()) {
      alert("Date, type, location, and description are required.");
      return;
    }
    if (reportType === "Other" && !customReportType.trim()) {
      alert("Please enter a custom incident type.");
      return;
    }
    const resolvedType = reportType === "Other" ? customReportType.trim() : reportType;
    onSubmit({
      incidentDate: incidentDate.trim(),
      incidentTime: incidentTime.trim() || "—",
      severity,
      reportType: resolvedType,
      location: location.trim(),
      description: description.trim(),
      status,
      unit: unit.trim() || undefined,
      assignedToAdmin: assignedToAdmin.trim() || undefined,
    });
    reset();
    onClose();
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
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="rounded bg-red-600 px-4 py-2 text-sm text-white">
            Save
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Incident Date *
          <input
            type="date"
            value={incidentDate}
            onChange={(e) => setIncidentDate(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="block text-sm">
          Time
          <input
            value={incidentTime}
            onChange={(e) => setIncidentTime(e.target.value)}
            placeholder="e.g. 9:30 PM"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="block text-sm">
          Severity *
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
        <label className="block text-sm">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          >
            <option value="Draft">Draft</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          Type *
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {reportType === "Other" && (
          <label className="block text-sm sm:col-span-2">
            Custom Type *
            <input
              value={customReportType}
              onChange={(e) => setCustomReportType(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            />
          </label>
        )}
        <label className="block text-sm">
          Unit
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="block text-sm">
          Assigned to Admin
          <input
            value={assignedToAdmin}
            onChange={(e) => setAssignedToAdmin(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          Location *
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          Description *
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
      </div>
    </Modal>
  );
}
