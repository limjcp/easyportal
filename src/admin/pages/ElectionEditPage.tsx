import { useCallback, useEffect, useState } from "react";
import { Modal } from "../../shared/Modal";
import { AdminPanelHeader } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type {
  BoardElection,
  BoardMemberApplication,
  ElectionCandidate,
  ElectionPosition,
  ElectionResults,
} from "../../resident/data/types";

const RESIDENT_TYPES = [
  "Board Members",
  "Absentee Owner",
  "Owners",
  "Tenants",
  "Occupants",
  "Unit Managers",
];

type ElectionEditPageProps = {
  route: AdminRoute & { page: "board-election-edit" };
  onNavigate: (route: AdminRoute) => void;
};

export function ElectionEditPage({ route, onNavigate }: ElectionEditPageProps) {
  const [election, setElection] = useState<BoardElection | null>(null);
  const [positions, setPositions] = useState<ElectionPosition[]>([]);
  const [candidatesByPosition, setCandidatesByPosition] = useState<Record<string, ElectionCandidate[]>>({});
  const [applications, setApplications] = useState<BoardMemberApplication[]>([]);
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newPositionTitle, setNewPositionTitle] = useState("");
  const [newCandidate, setNewCandidate] = useState<{
    positionId: string;
    name: string;
    unit: string;
    bio: string;
  }>({ positionId: "", name: "", unit: "", bio: "" });

  const load = useCallback(async () => {
    const [e, pos, apps, res] = await Promise.all([
      adminRepository.getBoardElectionById(route.id),
      adminRepository.getElectionPositions(route.id),
      adminRepository.getBoardMemberApplications(),
      adminRepository.getElectionResults(route.id),
    ]);
    setElection(e);
    setPositions(pos);
    setApplications(apps);
    setResults(res);
    const candMap: Record<string, ElectionCandidate[]> = {};
    await Promise.all(
      pos.map(async (p) => {
        candMap[p.id] = await adminRepository.getElectionCandidates(p.id);
      })
    );
    setCandidatesByPosition(candMap);
  }, [route.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!election) {
    return <div className="py-8 text-center text-slate-500">Loading...</div>;
  }

  const update = async (updates: Partial<BoardElection>) => {
    const updated = await adminRepository.updateBoardElection(route.id, updates);
    if (updated) setElection(updated);
  };

  const toggleResidentType = (type: string) => {
    const types = election.residentTypes.includes(type)
      ? election.residentTypes.filter((t) => t !== type)
      : [...election.residentTypes, type];
    update({ residentTypes: types });
  };

  const handleAddPosition = async () => {
    if (!newPositionTitle.trim()) return;
    await adminRepository.addElectionPosition(route.id, { title: newPositionTitle.trim() });
    setNewPositionTitle("");
    load();
  };

  const handleRemovePosition = async (id: string) => {
    if (!confirm("Remove this position and all its candidates?")) return;
    await adminRepository.removeElectionPosition(id);
    load();
  };

  const handleAddCandidate = async (positionId: string) => {
    const draft = positionId === newCandidate.positionId ? newCandidate : newCandidate;
    if (!draft.name.trim() || !draft.unit.trim()) {
      alert("Candidate name and unit are required.");
      return;
    }
    await adminRepository.addElectionCandidate(positionId, {
      name: draft.name.trim(),
      unit: draft.unit.trim(),
      bio: draft.bio.trim() || undefined,
    });
    setNewCandidate({ positionId: "", name: "", unit: "", bio: "" });
    load();
  };

  const handleImportApplication = async (
    positionId: string,
    applicationId: string
  ) => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return;
    await adminRepository.addElectionCandidate(positionId, {
      name: app.residentName,
      unit: app.unit,
      bio: app.statement.slice(0, 200),
      applicationId: app.id,
    });
    load();
  };

  const handleRemoveCandidate = async (id: string) => {
    if (!confirm("Remove this candidate?")) return;
    await adminRepository.removeElectionCandidate(id);
    load();
  };

  const importableApplications = applications.filter(
    (a) => a.status === "Approved" || a.status === "Under Review"
  );

  return (
    <>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <div className="flex flex-wrap gap-2">
            {election.status === "draft" && (
              <button
                type="button"
                onClick={() => update({ status: "scheduled" })}
                className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white"
              >
                Publish / Schedule
              </button>
            )}
            {(election.status === "active" || election.status === "scheduled") && (
              <button
                type="button"
                onClick={() => update({ status: "closed" })}
                className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white"
              >
                Close Early
              </button>
            )}
            {election.status !== "archived" && (
              <button
                type="button"
                onClick={async () => {
                  await adminRepository.archiveBoardElection(route.id);
                  onNavigate({ page: "board-elections" });
                }}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600"
              >
                Archive
              </button>
            )}
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="rounded bg-[#3476ef] px-4 py-1.5 text-sm text-white"
            >
              Preview
            </button>
          </div>
        }
      />

      <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
        <AdminPanelHeader title={`Edit Election: ${election.title}`} />

        <div className="space-y-8 p-4">
          <section>
            <h3 className="mb-3 font-semibold text-slate-700">Election Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                Title
                <input
                  type="text"
                  value={election.title}
                  onChange={(e) => update({ title: e.target.value })}
                  className="mt-1 block w-full rounded border border-slate-300 px-3 py-1.5"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Description
                <textarea
                  value={election.description}
                  onChange={(e) => update({ description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded border border-slate-300 px-3 py-1.5"
                />
              </label>
              <fieldset>
                <legend className="text-sm font-medium text-slate-600">Status</legend>
                <div className="mt-1 flex flex-wrap gap-4">
                  {(["draft", "scheduled", "closed"] as const).map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={election.status === s || (s === "scheduled" && election.status === "active")}
                        onChange={() => update({ status: s })}
                      />
                      {s === "scheduled" ? "Scheduled / Active" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={election.anonymous}
                  onChange={(e) => update({ anonymous: e.target.checked })}
                />
                Anonymous voting (hide per-unit choices in results)
              </label>
              <label className="text-sm">
                Voting Opens
                <input
                  type="date"
                  value={election.opensAt}
                  onChange={(e) => update({ opensAt: e.target.value })}
                  className="mt-1 block w-full rounded border border-slate-300 px-3 py-1.5"
                />
              </label>
              <label className="text-sm">
                Voting Closes
                <input
                  type="date"
                  value={election.closesAt}
                  onChange={(e) => update({ closesAt: e.target.value })}
                  className="mt-1 block w-full rounded border border-slate-300 px-3 py-1.5"
                />
              </label>
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-slate-700">Eligible Resident Types</h3>
            <div className="flex flex-wrap gap-4">
              {RESIDENT_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={election.residentTypes.includes(type)}
                    onChange={() => toggleResidentType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-semibold text-slate-700">Positions</h3>
            <div className="space-y-4">
              {positions.map((pos) => (
                <div key={pos.id} className="rounded border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={pos.title}
                      onChange={(e) =>
                        adminRepository.updateElectionPosition(pos.id, { title: e.target.value }).then(load)
                      }
                      className="rounded border border-slate-300 px-2 py-1 text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePosition(pos.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <ul className="mb-3 space-y-2">
                    {(candidatesByPosition[pos.id] ?? []).map((c) => (
                      <li
                        key={c.id}
                        className="flex items-start justify-between gap-2 rounded bg-slate-50 px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium">{c.name}</span>
                          <span className="text-slate-500"> — Unit {c.unit}</span>
                          {c.bio && <p className="mt-1 text-slate-600">{c.bio}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCandidate(c.id)}
                          className="shrink-0 text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="mb-2 flex flex-wrap gap-2">
                    <input
                      type="text"
                      placeholder="Candidate name"
                      value={newCandidate.positionId === pos.id ? newCandidate.name : ""}
                      onChange={(e) =>
                        setNewCandidate({
                          positionId: pos.id,
                          name: e.target.value,
                          unit: newCandidate.positionId === pos.id ? newCandidate.unit : "",
                          bio: newCandidate.positionId === pos.id ? newCandidate.bio : "",
                        })
                      }
                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={newCandidate.positionId === pos.id ? newCandidate.unit : ""}
                      onChange={(e) =>
                        setNewCandidate({
                          positionId: pos.id,
                          name: newCandidate.positionId === pos.id ? newCandidate.name : "",
                          unit: e.target.value,
                          bio: newCandidate.positionId === pos.id ? newCandidate.bio : "",
                        })
                      }
                      className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCandidate(pos.id)}
                      className="rounded bg-[#3476ef] px-3 py-1 text-sm text-white"
                    >
                      Add Candidate
                    </button>
                  </div>

                  {importableApplications.length > 0 && (
                    <select
                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleImportApplication(pos.id, e.target.value);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">Import from application…</option>
                      {importableApplications.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.residentName} (Unit {a.unit}) — {a.status}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newPositionTitle}
                onChange={(e) => setNewPositionTitle(e.target.value)}
                placeholder="New position title (e.g. President)"
                className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={handleAddPosition}
                className="rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white"
              >
                Add Position
              </button>
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-semibold text-slate-700">Results</h3>
            {results && results.positions.length === 0 ? (
              <p className="text-sm text-slate-500">Add positions and candidates to see results.</p>
            ) : (
              results?.positions.map((pos) => (
                <div key={pos.positionId} className="mb-6">
                  <h4 className="mb-2 font-medium text-slate-800">
                    {pos.positionTitle}{" "}
                    <span className="text-sm font-normal text-slate-500">
                      ({pos.totalBallots} of {results.eligibleUnits} units voted)
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {pos.candidates.map((c) => {
                      const pct =
                        pos.totalBallots > 0 ? Math.round((c.votes / pos.totalBallots) * 100) : 0;
                      return (
                        <div key={c.candidateId}>
                          <div className="flex justify-between text-sm">
                            <span>
                              {c.name} (Unit {c.unit})
                            </span>
                            <span className="text-slate-600">
                              {c.votes} vote{c.votes !== 1 ? "s" : ""} ({pct}%)
                            </span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded bg-slate-100">
                            <div
                              className="h-full bg-[#3476ef]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Preview: ${election.title}`}
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="rounded border border-slate-300 px-4 py-2 text-sm"
          >
            Close
          </button>
        }
      >
        <p className="mb-4 text-sm text-slate-600">{election.description}</p>
        <p className="mb-4 text-xs text-slate-500">
          Voting: {election.opensAt} — {election.closesAt}
        </p>
        {positions.map((pos) => (
          <div key={pos.id} className="mb-4 rounded border border-slate-200 p-3">
            <h4 className="font-medium">{pos.title}</h4>
            <ul className="mt-2 space-y-1 text-sm">
              {(candidatesByPosition[pos.id] ?? []).map((c) => (
                <li key={c.id}>
                  {c.name} — Unit {c.unit}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Modal>
    </>
  );
}
