import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../shared/Modal";
import { companyRepository } from "../data/companyRepository";
import type {
  CompanyBuilding,
  CompanyEmployee,
  CompanyRole,
  PermissionModuleRow,
} from "../../resident/data/types";

const ROLE_OPTIONS: CompanyRole[] = [
  "Company Owner",
  "Company Administrator",
  "Company Accountant",
  "Property Manager",
  "Property Administrator",
  "Board Member",
  "Resident (Admin)",
  "Concierge",
  "Gatehouse Keeper",
  "Superintendent",
  "Resident",
];

const TAB_OPTIONS = [
  { id: "profile", label: "Profile & Permissions" },
  { id: "buildings", label: "Building Assignments" },
  { id: "notifications", label: "Email & Mobile Notifications" },
  { id: "history", label: "Email History" },
] as const;

const PERMISSION_FIELDS: Array<keyof Pick<PermissionModuleRow, "create" | "view" | "edit" | "delete" | "archive">> = [
  "create",
  "view",
  "edit",
  "delete",
  "archive",
];

type EmployeeNotificationRow = {
  id: string;
  label: string;
  email: boolean;
  push: boolean;
  required?: boolean;
};

type EmployeeEditTab = (typeof TAB_OPTIONS)[number]["id"];

function formatLastLogin(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US");
}

function defaultNotificationRows(): EmployeeNotificationRow[] {
  return [
    { id: "board-approvals", label: "Board Approvals", email: true, push: false, required: true },
    { id: "documents", label: "Documents", email: true, push: false },
    { id: "events", label: "Events", email: true, push: false },
    { id: "incident-reports", label: "Incident Reports", email: true, push: false },
    { id: "news-notices", label: "News & Notices", email: true, push: false },
    { id: "service-requests", label: "Service Requests", email: true, push: false },
    { id: "subscriptions", label: "Subscriptions", email: true, push: false, required: true },
    { id: "suggestions", label: "Suggestion Box", email: true, push: false },
    { id: "user-registrations", label: "User Registrations", email: true, push: false },
    { id: "profile-updates", label: "User Profile Updates", email: true, push: false },
  ];
}

type EditEmployeeModalProps = {
  open: boolean;
  employee: CompanyEmployee | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EditEmployeeModal({ open, employee, onClose, onSaved }: EditEmployeeModalProps) {
  const [activeTab, setActiveTab] = useState<EmployeeEditTab>("profile");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [timezone, setTimezone] = useState("America/Toronto");
  const [telHome, setTelHome] = useState("");
  const [telMobile, setTelMobile] = useState("");
  const [telWork, setTelWork] = useState("");
  const [sendEmailLogin, setSendEmailLogin] = useState(false);
  const [isResident, setIsResident] = useState(false);
  const [role, setRole] = useState<CompanyRole>("Property Administrator");
  const [permissions, setPermissions] = useState<PermissionModuleRow[]>([]);
  const [notifications, setNotifications] = useState<EmployeeNotificationRow[]>(defaultNotificationRows());
  const [buildingIds, setBuildingIds] = useState<string[]>([]);
  const [buildings, setBuildings] = useState<CompanyBuilding[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  useEffect(() => {
    if (open && employee) {
      setActiveTab("profile");
      setStatus("active");
      setFirstName(employee.firstName);
      setLastName(employee.lastName);
      setEmail(employee.email);
      setTitle("");
      setTimezone("America/Toronto");
      setTelHome("");
      setTelMobile("");
      setTelWork("");
      setSendEmailLogin(false);
      setIsResident(false);
      setRole(employee.role);
      setBuildingIds([...employee.assignedBuildingIds]);
      setNotifications(defaultNotificationRows());
      companyRepository.getBuildings().then(setBuildings);
      companyRepository.getEmployeePermissions(employee.membershipId ?? employee.id).then(setPermissions);
    }
  }, [open, employee]);

  const assignedBuildings = useMemo(
    () => buildings.filter((building) => buildingIds.includes(building.id)),
    [buildingIds, buildings]
  );

  const emailHistory = useMemo(() => {
    if (!employee) return [];
    return [
      {
        id: `${employee.id}-1`,
        date: "2026-05-31 05:31 AM",
        subject: "Low Severity Service Request #1100552 Updated",
        status: "Delivered",
      },
      {
        id: `${employee.id}-2`,
        date: "2026-05-31 05:20 AM",
        subject: "Board Approval comment added",
        status: "Delivered",
      },
      {
        id: `${employee.id}-3`,
        date: "2026-05-30 09:55 AM",
        subject: "Resident Portal Signup",
        status: "Delivered",
      },
      {
        id: `${employee.id}-4`,
        date: "2026-05-30 09:15 PM",
        subject: "A new Notice has been posted",
        status: "Delivered",
      },
      {
        id: `${employee.id}-5`,
        date: "2026-05-30 09:10 AM",
        subject: "Important Notice posted",
        status: "Delivered",
      },
    ];
  }, [employee]);

  const handleSave = async () => {
    if (!employee) return;
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      alert("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    await companyRepository.updateEmployee(employee.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      role,
      assignedBuildingIds: buildingIds,
    });
    await companyRepository.saveEmployeePermissions(employee.membershipId ?? employee.id, permissions);
    setSaving(false);
    onSaved();
    onClose();
  };

  const toggleBuilding = (id: string) => {
    setBuildingIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const togglePermission = (moduleKey: string, field: (typeof PERMISSION_FIELDS)[number]) => {
    setPermissions((prev) =>
      prev.map((row) => (row.moduleKey === moduleKey ? { ...row, [field]: !row[field] } : row))
    );
  };

  const setAllPermissions = (value: boolean) => {
    setPermissions((prev) =>
      prev.map((row) => ({
        ...row,
        create: value,
        view: value,
        edit: value,
        delete: value,
        archive: value,
      }))
    );
  };

  const loadRoleDefaults = async () => {
    setLoadingDefaults(true);
    const roleDefaults = await companyRepository.getRolePermissions(role);
    setPermissions(roleDefaults);
    setLoadingDefaults(false);
  };

  const setNotificationColumn = (field: "email" | "push", value: boolean) => {
    setNotifications((prev) =>
      prev.map((row) => (row.required ? row : { ...row, [field]: value }))
    );
  };

  const toggleNotification = (id: string, field: "email" | "push") => {
    setNotifications((prev) =>
      prev.map((row) => {
        if (row.id !== id || row.required) return row;
        return { ...row, [field]: !row[field] };
      })
    );
  };

  if (!employee) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit: ${employee.firstName} ${employee.lastName}`}
      size="xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => window.alert("Archive is mock-only in this phase.")}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
          >
            Archive
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
          >
            Cancel
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded px-3 py-1.5 text-xs font-medium ${
                activeTab === tab.id
                  ? "bg-[#2e3f4f] text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded border border-slate-300 bg-white">
              <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 font-semibold text-slate-700">
                User Profile
              </div>
              <div className="space-y-3 p-3">
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={status === "active"}
                      onChange={() => setStatus("active")}
                      name="employee-status"
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={status === "inactive"}
                      onChange={() => setStatus("inactive")}
                      name="employee-status"
                    />
                    Inactive
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs uppercase text-slate-500">First Name *</span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-2"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase text-slate-500">Last Name *</span>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-2"
                    />
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="text-xs uppercase text-slate-500">Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-2"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={sendEmailLogin}
                      onChange={(e) => setSendEmailLogin(e.target.checked)}
                    />
                    Email Login Details
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase text-slate-500">Title</span>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-2"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase text-slate-500">Time Zone</span>
                    <input
                      type="text"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-2"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase text-slate-500">Tel Home</span>
                    <input
                      type="text"
                      value={telHome}
                      onChange={(e) => setTelHome(e.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-2"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase text-slate-500">Tel Mobile</span>
                    <input
                      type="text"
                      value={telMobile}
                      onChange={(e) => setTelMobile(e.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-2"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase text-slate-500">Tel Work</span>
                    <input
                      type="text"
                      value={telWork}
                      onChange={(e) => setTelWork(e.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-2"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded border border-slate-300 bg-white">
              <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 font-semibold text-slate-700">
                User Role & Permissions
              </div>
              <div className="space-y-3 p-3">
                <label className="space-y-1">
                  <span className="text-xs uppercase text-slate-500">Select Role *</span>
                  <select
                    value={role}
                    onChange={(e) => {
                      const nextRole = e.target.value as CompanyRole;
                      setRole(nextRole);
                      companyRepository.getRolePermissions(nextRole).then(setPermissions);
                    }}
                    className="w-full rounded border border-slate-300 px-2 py-2"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isResident}
                    onChange={(e) => setIsResident(e.target.checked)}
                  />
                  Also a resident?
                </label>
                <div className="flex flex-wrap gap-3 text-xs">
                  <button
                    type="button"
                    onClick={loadRoleDefaults}
                    disabled={loadingDefaults}
                    className="text-[#3476ef] hover:underline"
                  >
                    Defaults
                  </button>
                  <button type="button" onClick={() => setAllPermissions(true)} className="text-[#3476ef] hover:underline">
                    Select All
                  </button>
                  <button type="button" onClick={() => setAllPermissions(false)} className="text-[#3476ef] hover:underline">
                    Select None
                  </button>
                </div>
                <div className="max-h-[360px] overflow-auto rounded border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-2 py-2 text-left">Module</th>
                        {PERMISSION_FIELDS.map((field) => (
                          <th key={field} className="px-2 py-2 text-center capitalize">
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map((permissionRow) => (
                        <tr key={permissionRow.moduleKey} className="border-t border-slate-100">
                          <td className="px-2 py-1.5 font-medium text-slate-700">{permissionRow.label}</td>
                          {PERMISSION_FIELDS.map((field) => (
                            <td key={field} className="px-2 py-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={permissionRow[field]}
                                onChange={() => togglePermission(permissionRow.moduleKey, field)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "buildings" ? (
          <div className="rounded border border-slate-300 bg-white">
            <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 font-semibold text-slate-700">
              Building Assignments
            </div>
            <div className="space-y-3 p-3">
              <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                Company Owners, Administrators, and Accountants have access to all buildings regardless of assignment.
              </div>
              <div className="max-h-40 overflow-y-auto rounded border border-slate-200 p-2">
                <p className="mb-2 text-xs font-semibold text-slate-600">Add Buildings:</p>
                {buildings.map((building) => (
                  <label key={building.id} className="flex items-start gap-2 py-1 text-xs">
                    <input
                      type="checkbox"
                      checked={buildingIds.includes(building.id)}
                      onChange={() => toggleBuilding(building.id)}
                    />
                    <span>
                      ({building.code}) {building.name} - {building.address}
                    </span>
                  </label>
                ))}
              </div>
              <div className="overflow-auto rounded border border-slate-200">
                <table className="w-full min-w-[640px] text-xs">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-2 py-2 text-left">Address</th>
                      <th className="px-2 py-2 text-center">Last Login</th>
                      <th className="px-2 py-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedBuildings.map((building) => (
                      <tr key={building.id} className="border-t border-slate-100">
                        <td className="px-2 py-2">
                          {building.code}
                          <br />
                          {building.condoLine}
                          <br />
                          {building.cityProvincePostal}
                        </td>
                        <td className="px-2 py-2 text-center">{formatLastLogin(building.lastActivity)}</td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleBuilding(building.id)}
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                          >
                            Remove Assignment
                          </button>
                        </td>
                      </tr>
                    ))}
                    {assignedBuildings.length === 0 ? (
                      <tr>
                        <td className="px-2 py-5 text-center text-slate-500" colSpan={3}>
                          No building assignments.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "notifications" ? (
          <div className="rounded border border-slate-300 bg-white">
            <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 font-semibold text-slate-700">
              Email & Mobile Notifications
            </div>
            <div className="space-y-3 p-3">
              <p className="text-xs text-slate-600">
                Notifications are tied to permissions. If the user does not have at least View permission for a module,
                options may not display.
              </p>
              <div className="overflow-auto rounded border border-slate-200">
                <table className="w-full min-w-[560px] text-xs">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-2 py-2 text-left">Module</th>
                      <th className="px-2 py-2 text-center">
                        Email Notices
                        <div className="mt-1 flex justify-center gap-2">
                          <button
                            type="button"
                            className="text-[#3476ef] hover:underline"
                            onClick={() => setNotificationColumn("email", true)}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            className="text-[#3476ef] hover:underline"
                            onClick={() => setNotificationColumn("email", false)}
                          >
                            Select None
                          </button>
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center">
                        Mobile Notices
                        <div className="mt-1 flex justify-center gap-2">
                          <button
                            type="button"
                            className="text-[#3476ef] hover:underline"
                            onClick={() => setNotificationColumn("push", true)}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            className="text-[#3476ef] hover:underline"
                            onClick={() => setNotificationColumn("push", false)}
                          >
                            Select None
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-2 py-2 font-medium text-slate-700">{row.label}</td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.email}
                            disabled={row.required}
                            onChange={() => toggleNotification(row.id, "email")}
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.push}
                            disabled={row.required}
                            onChange={() => toggleNotification(row.id, "push")}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked readOnly />
                Required notifications cannot be changed.
              </label>
            </div>
          </div>
        ) : null}

        {activeTab === "history" ? (
          <div className="rounded border border-slate-300 bg-white">
            <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 font-semibold text-slate-700">
              45 Day Email History
            </div>
            <div className="space-y-3 p-3">
              <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                Email activity is on a per-email basis and can include activity across all user accounts using this
                email address.
              </div>
              <div className="overflow-auto rounded border border-slate-200">
                <table className="w-full min-w-[600px] text-xs">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-2 py-2 text-center">Date</th>
                      <th className="px-2 py-2 text-left">Subject</th>
                      <th className="px-2 py-2 text-center">Status</th>
                      <th className="px-2 py-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailHistory.map((historyRow) => (
                      <tr key={historyRow.id} className="border-t border-slate-100">
                        <td className="px-2 py-2 text-center">{historyRow.date}</td>
                        <td className="px-2 py-2">{historyRow.subject}</td>
                        <td className="px-2 py-2 text-center">
                          <span className="rounded bg-[#5cb85c] px-2 py-0.5 text-white">{historyRow.status}</span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => window.alert("Email detail modal is mock-only in this phase.")}
                            className="rounded bg-[#3476ef] px-2 py-1 text-xs text-white"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
