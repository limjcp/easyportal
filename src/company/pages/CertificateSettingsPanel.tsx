import { useState, type ReactNode } from "react";
import { FaCertificate, FaCheck, FaClock, FaPlus, FaUsers } from "react-icons/fa";

const PROCESSING_OPTIONS = [
  { status: "Active", name: "Regular Delivery", time: "10 Business Days", fee: "$100.00" },
  { status: "Active", name: "Rush Delivery", time: "5 Calendar Days", fee: "$282.50" },
  { status: "Active", name: "VIP Rush Delivery", time: "2 Calendar Days", fee: "$406.80" },
];

const AGENTS = [
  { notifyPurchaser: true, name: "Vina Digno", email: "vina@mvpcondos.com" },
  { notifyPurchaser: true, name: "Richelle Diane", email: "richelle@mvpcondos.com" },
  { notifyPurchaser: false, name: "Scott Hundey", email: "scott@mvpcondos.com" },
];

function StepInstructions({ step, children }: { step: number; children: ReactNode }) {
  return (
    <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
          {step}
        </span>
        <p className="text-sm text-slate-600">{children}</p>
      </div>
    </div>
  );
}

function PanelCard({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: typeof FaCertificate;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Icon className="text-slate-500" />
          {title}
        </h3>
        {action}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

export function CertificateSettingsPanel() {
  const [cutOffTime, setCutOffTime] = useState("6:00 PM");

  return (
    <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
      <div className="bg-[#7b4bb7] px-4 py-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <FaCertificate />
          Request Settings
        </h3>
      </div>

      <div className="space-y-6 p-4">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <StepInstructions step={1}>
              Optionally set the starting certificate number sequence. New Certificate orders will
              start with this number. This cannot be changed after the first Certificate Request has
              been submitted.
            </StepInstructions>
          </div>
          <div className="lg:col-span-7">
            <PanelCard title="Certificate Number Sequencing" icon={FaCertificate}>
              <p className="text-center text-sm text-slate-600">
                A starting sequence number was not specified.
                <br />
                Requests began at <strong>#1000</strong>
              </p>
            </PanelCard>
          </div>
        </div>

        <hr className="border-slate-200" />

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <StepInstructions step={2}>
              Create your custom processing options by selecting the processing time and setting a
              fee for each. Holidays are not included in the due date calculation.
            </StepInstructions>
          </div>
          <div className="lg:col-span-7">
            <PanelCard
              title="Processing Options"
              icon={FaCertificate}
              action={
                <button
                  type="button"
                  className="rounded bg-[#7b4bb7] px-2 py-1 text-xs text-white hover:bg-[#6a419f]"
                  onClick={() => alert("Add processing option — coming soon.")}
                >
                  <FaPlus />
                </button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] border border-slate-200 text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="px-2 py-2 text-center">Status</th>
                      <th className="px-2 py-2 text-center">Name</th>
                      <th className="px-2 py-2 text-center">Time</th>
                      <th className="px-2 py-2 text-center">Fee</th>
                      <th className="px-2 py-2 text-center" />
                    </tr>
                  </thead>
                  <tbody>
                    {PROCESSING_OPTIONS.map((opt) => (
                      <tr key={opt.name} className="border-b border-slate-100">
                        <td className="px-2 py-2 text-center">
                          <span className="rounded bg-[#5cb85c] px-2 py-0.5 text-xs text-white">
                            {opt.status}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">{opt.name}</td>
                        <td className="px-2 py-2 text-center">{opt.time}</td>
                        <td className="px-2 py-2 text-center">{opt.fee}</td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            className="mr-1 rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
                            onClick={() => alert("Edit — coming soon.")}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
                            onClick={() => alert("Delete — coming soon.")}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelCard>
          </div>
        </div>

        <hr className="border-slate-200" />

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <StepInstructions step={3}>
              Set the processing cut off time. Certificate requests that arrive after this time will
              have due dates that start calculating on the next day.
            </StepInstructions>
          </div>
          <div className="lg:col-span-7">
            <PanelCard title="Cut Off Time" icon={FaClock}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-600">Received After</span>
                <select
                  value={cutOffTime}
                  onChange={(e) => setCutOffTime(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                >
                  {["1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    )
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => alert(`Cut-off time saved: ${cutOffTime}`)}
                  className="rounded bg-[#7b4bb7] px-4 py-1.5 text-sm text-white hover:bg-[#6a419f]"
                >
                  Save
                </button>
              </div>
            </PanelCard>
          </div>
        </div>

        <hr className="border-slate-200" />

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <StepInstructions step={4}>
              Set your processing agents. These agents will receive notifications for new requests
              as well as email reminders for past due or due soon requests.
            </StepInstructions>
          </div>
          <div className="lg:col-span-7">
            <PanelCard
              title="Processing Agents"
              icon={FaUsers}
              action={
                <button
                  type="button"
                  className="rounded bg-[#7b4bb7] px-2 py-1 text-xs text-white hover:bg-[#6a419f]"
                  onClick={() => alert("Add agent — coming soon.")}
                >
                  <FaPlus />
                </button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] border border-slate-200 text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="px-2 py-2 text-center" title="Notify purchaser on order">
                        ✉
                      </th>
                      <th className="px-2 py-2 text-left">Name</th>
                      <th className="hidden px-2 py-2 text-left md:table-cell">Email</th>
                      <th className="px-2 py-2 text-center" />
                    </tr>
                  </thead>
                  <tbody>
                    {AGENTS.map((agent) => (
                      <tr key={agent.email} className="border-b border-slate-100">
                        <td className="px-2 py-2 text-center">
                          {agent.notifyPurchaser ? (
                            <FaCheck className="inline text-green-600" />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2">{agent.name}</td>
                        <td className="hidden px-2 py-2 md:table-cell">{agent.email}</td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            className="mr-1 rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelCard>
          </div>
        </div>
      </div>
    </div>
  );
}
