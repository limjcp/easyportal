import { useCallback, useEffect, useState, type ReactNode } from "react";
import { FaCertificate, FaClock, FaPlus, FaUsers } from "react-icons/fa";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { companyRepository } from "../data/companyRepository";
import type { CertificateAgent, CertificateProcessingOption } from "../../data/supabase/companyReportOperations";

type CertificateSettingsPanelProps = {
  buildingId?: string;
  buildings?: { value: string; label: string }[];
};

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

export function CertificateSettingsPanel({ buildingId, buildings = [] }: CertificateSettingsPanelProps) {
  const [selectedBuildingId, setSelectedBuildingId] = useState(buildingId ?? buildings[0]?.value ?? "");
  const [processingOptions, setProcessingOptions] = useState<CertificateProcessingOption[]>([]);
  const [agents, setAgents] = useState<CertificateAgent[]>([]);
  const [cutOffTime, setCutOffTime] = useState("6:00 PM");
  const [loadingSettings, setLoadingSettings] = useState(false);

  useEffect(() => {
    if (buildingId && buildingId !== "all") {
      setSelectedBuildingId(buildingId);
    } else if (!selectedBuildingId && buildings[0]?.value) {
      setSelectedBuildingId(buildings[0].value);
    }
  }, [buildingId, buildings, selectedBuildingId]);

  useEffect(() => {
    if (!selectedBuildingId) return;
    setLoadingSettings(true);
    companyRepository
      .getCertificateSettings(selectedBuildingId)
      .then((settings) => {
        setProcessingOptions(settings.processingOptions);
        setAgents(settings.agents);
        setCutOffTime(settings.cutOffTime);
      })
      .finally(() => setLoadingSettings(false));
  }, [selectedBuildingId]);

  const { run: saveSettings, loading: saving } = useAsyncAction(
    useCallback(async () => {
      if (!selectedBuildingId) return;
      await companyRepository.saveCertificateSettings(selectedBuildingId, {
        processingOptions,
        agents,
        cutOffTime,
      });
    }, [selectedBuildingId, processingOptions, agents, cutOffTime]),
    { successMessage: "Certificate settings saved." }
  );

  const { run: saveCutOff, loading: savingCutOff } = useAsyncAction(
    useCallback(async () => {
      if (!selectedBuildingId) return;
      await companyRepository.saveCertificateSettings(selectedBuildingId, {
        processingOptions,
        agents,
        cutOffTime,
      });
    }, [selectedBuildingId, processingOptions, agents, cutOffTime]),
    { successMessage: "Cut-off time saved." }
  );

  if (!selectedBuildingId) {
    return (
      <div className="rounded-sm border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-600">
        Select a community to manage certificate settings.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
      <div className="bg-[#7b4bb7] px-4 py-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <FaCertificate />
          Request Settings
        </h3>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <label className="text-sm text-slate-700">
          Community
          <select
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            className="ml-2 rounded border border-slate-300 px-2 py-1 text-sm"
          >
            {buildings.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label.trim()}
              </option>
            ))}
          </select>
        </label>
        {loadingSettings ? <span className="ml-3 text-xs text-slate-500">Loading…</span> : null}
      </div>

      <div className="space-y-6 p-4">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <StepInstructions step={1}>
              Optionally set the starting certificate number sequence. New Certificate orders will start with this
              number. This cannot be changed after the first Certificate Request has been submitted.
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
              Create your custom processing options by selecting the processing time and setting a fee for each.
              Holidays are not included in the due date calculation.
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
                  onClick={() =>
                    setProcessingOptions((prev) => [
                      ...prev,
                      { status: "Active", name: "New Option", time: "5 Business Days", fee: "$0.00" },
                    ])
                  }
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
                    {processingOptions.map((opt, index) => (
                      <tr key={`${opt.name}-${index}`} className="border-b border-slate-100">
                        <td className="px-2 py-2 text-center">
                          <span className="rounded bg-[#5cb85c] px-2 py-0.5 text-xs text-white">{opt.status}</span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            value={opt.name}
                            onChange={(e) =>
                              setProcessingOptions((prev) =>
                                prev.map((row, i) => (i === index ? { ...row, name: e.target.value } : row))
                              )
                            }
                            className="w-full rounded border border-slate-300 px-1 py-0.5 text-center text-sm"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            value={opt.time}
                            onChange={(e) =>
                              setProcessingOptions((prev) =>
                                prev.map((row, i) => (i === index ? { ...row, time: e.target.value } : row))
                              )
                            }
                            className="w-full rounded border border-slate-300 px-1 py-0.5 text-center text-sm"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            value={opt.fee}
                            onChange={(e) =>
                              setProcessingOptions((prev) =>
                                prev.map((row, i) => (i === index ? { ...row, fee: e.target.value } : row))
                              )
                            }
                            className="w-full rounded border border-slate-300 px-1 py-0.5 text-center text-sm"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
                            onClick={() => setProcessingOptions((prev) => prev.filter((_, i) => i !== index))}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-right">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveSettings()}
                  className="rounded bg-[#7b4bb7] px-4 py-1.5 text-sm text-white hover:bg-[#6a419f] disabled:opacity-50"
                >
                  Save Processing Options
                </button>
              </div>
            </PanelCard>
          </div>
        </div>

        <hr className="border-slate-200" />

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <StepInstructions step={3}>
              Set the processing cut off time. Certificate requests that arrive after this time will have due dates
              that start calculating on the next day.
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
                  disabled={savingCutOff}
                  onClick={() => void saveCutOff()}
                  className="rounded bg-[#7b4bb7] px-4 py-1.5 text-sm text-white hover:bg-[#6a419f] disabled:opacity-50"
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
              Set your processing agents. These agents will receive notifications for new requests as well as email
              reminders for past due or due soon requests.
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
                  onClick={() =>
                    setAgents((prev) => [...prev, { notifyPurchaser: false, name: "", email: "" }])
                  }
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
                    {agents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-2 py-4 text-center text-slate-500">
                          No processing agents configured.
                        </td>
                      </tr>
                    ) : (
                      agents.map((agent, index) => (
                        <tr key={`${agent.email}-${index}`} className="border-b border-slate-100">
                          <td className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={agent.notifyPurchaser}
                              onChange={(e) =>
                                setAgents((prev) =>
                                  prev.map((row, i) =>
                                    i === index ? { ...row, notifyPurchaser: e.target.checked } : row
                                  )
                                )
                              }
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={agent.name}
                              onChange={(e) =>
                                setAgents((prev) =>
                                  prev.map((row, i) => (i === index ? { ...row, name: e.target.value } : row))
                                )
                              }
                              className="w-full rounded border border-slate-300 px-1 py-0.5 text-sm"
                            />
                          </td>
                          <td className="hidden px-2 py-2 md:table-cell">
                            <input
                              value={agent.email}
                              onChange={(e) =>
                                setAgents((prev) =>
                                  prev.map((row, i) => (i === index ? { ...row, email: e.target.value } : row))
                                )
                              }
                              className="w-full rounded border border-slate-300 px-1 py-0.5 text-sm"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
                              onClick={() => setAgents((prev) => prev.filter((_, i) => i !== index))}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-right">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveSettings()}
                  className="rounded bg-[#7b4bb7] px-4 py-1.5 text-sm text-white hover:bg-[#6a419f] disabled:opacity-50"
                >
                  Save Agents
                </button>
              </div>
            </PanelCard>
          </div>
        </div>
      </div>
    </div>
  );
}
