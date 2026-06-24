import { useCallback, useEffect, useMemo, useState } from "react";
import { FaWrench } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FileUploadZone } from "../../shared/FileUploadZone";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
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
import { AdminSectionHeader } from "../components/CommentSection";
import { adminRepository } from "../data/adminRepository";
import { validateAttachmentFile } from "../../shared/attachmentUtils";
import type { CreateAdminServiceRequestInput } from "../../resident/data/types";

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
  const [customLocation, setCustomLocation] = useState("");
  const [contact, setContact] = useState("");
  const [permissionToEnter, setPermissionToEnter] = useState("");
  const [permissionNotes, setPermissionNotes] = useState("");
  const [severity, setSeverity] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [dbCategoryNames, setDbCategoryNames] = useState<string[]>([]);
  const [buildingCommonAreas, setBuildingCommonAreas] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [uploadSlots, setUploadSlots] = useState([1, 2, 3]);
  const [slotFiles, setSlotFiles] = useState<Record<number, File>>({});
  const [residentOptions, setResidentOptions] = useState<string[]>([""]);
  const [emergencyNoticeOpen, setEmergencyNoticeOpen] = useState(false);

  const derivedUnit = resident.match(/(Unit\s*\d+)/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";

  const { run: handleSubmit, loading: submitting, error } = useAsyncAction(
    useCallback(async () => {
      if (isEmergencyServiceRequestSeverity(severity)) {
        throw new Error(EMERGENCY_SEVERITY_SUBMIT_ERROR);
      }
      const resolvedLocation = resolveServiceRequestLocation(location, customLocation);
      const resolvedCategory = category === "Other" ? customCategory.trim() : category;
      if (!resident || !resolvedLocation || !permissionToEnter || !severity || !category || !description) {
        throw new Error("Please fill in all required fields.");
      }
      if (category === "Other" && !resolvedCategory) {
        throw new Error("Please enter a custom category name.");
      }
      const files = Object.values(slotFiles);
      for (const file of files) {
        const validationError = validateAttachmentFile(file);
        if (validationError) {
          throw new Error(validationError);
        }
      }
      await onSubmit({
        assignedTo,
        resident,
        unit: derivedUnit || undefined,
        visibility,
        contact,
        location: resolvedLocation,
        permissionToEnter,
        permissionNotes,
        severity,
        category: resolvedCategory,
        description,
        files: files.length ? files : undefined,
      });
      onClose();
    }, [
      assignedTo,
      resident,
      derivedUnit,
      visibility,
      contact,
      location,
      customLocation,
      permissionToEnter,
      permissionNotes,
      severity,
      category,
      customCategory,
      description,
      slotFiles,
      onSubmit,
      onClose,
    ]),
    { successMessage: "Service request submitted.", showErrorToast: false }
  );

  useEffect(() => {
    if (!open) {
      setAssignedTo("All Admins");
      setResident("");
      setVisibility("Only Administrators");
      setLocation("");
      setCustomLocation("");
      setContact("");
      setPermissionToEnter("");
      setPermissionNotes("");
      setSeverity("");
      setCategory("");
      setCustomCategory("");
      setDescription("");
      setUploadSlots([1, 2, 3]);
      setSlotFiles({});
      setDbCategoryNames([]);
      setBuildingCommonAreas([]);
      setEmergencyNoticeOpen(false);
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
      setDbCategoryNames(active.map((item) => item.name));
    });
    adminRepository.getBuildingDefinition().then((definition) => {
      setBuildingCommonAreas(definition.commonAreas);
    });
  }, [open]);

  useEffect(() => {
    if (category !== "Other") {
      setCustomCategory("");
    }
  }, [category]);

  useEffect(() => {
    if (location !== "Other") {
      setCustomLocation("");
    }
  }, [location]);

  useEffect(() => {
    if (severity === "Emergency") {
      setEmergencyNoticeOpen(true);
    }
  }, [severity]);

  const categoryOptions = useMemo(
    () => ["", ...mergeServiceCategoryOptions(dbCategoryNames)],
    [dbCategoryNames]
  );

  const locationOptions = useMemo(
    () => ["", ...mergeServiceLocationOptions(buildingCommonAreas, derivedUnit || resident || undefined)],
    [buildingCommonAreas, derivedUnit, resident]
  );

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
            <SelectField
              label="Location *"
              value={location}
              onChange={setLocation}
              options={locationOptions}
            />
            {location === "Other" && (
              <InputField
                label="Custom Location *"
                value={customLocation}
                onChange={setCustomLocation}
                placeholder="Type custom location"
              />
            )}
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
            options={[...SERVICE_REQUEST_SEVERITY_OPTIONS]}
          />
          <SelectField
            label="Request Category *"
            value={category}
            onChange={setCategory}
            options={categoryOptions}
          />
        </div>
        {isEmergencyServiceRequestSeverity(severity) ? (
          <EmergencySeverityInlineNotice className="mx-3 mb-3" />
        ) : null}
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

      <EmergencySeverityNoticeModal
        open={emergencyNoticeOpen}
        onClose={() => setEmergencyNoticeOpen(false)}
      />
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
