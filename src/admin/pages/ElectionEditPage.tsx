import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "../../shared/Modal";
import { ConfirmModal } from "../../shared/ConfirmModal";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { usePageContentBusy } from "../../shared/usePageContentBusy";
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
  const [confirmKind, setConfirmKind] = useState<"position" | "candidate" | null>(null);
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

  const pendingUpdatesRef = useRef<Partial<BoardElection> | null>(null);
  const pendingPositionIdRef = useRef<string | null>(null);
  const pendingCandidateIdRef = useRef<string | null>(null);
  const pendingImportRef = useRef<{ positionId: string; applicationId: string } | null>(null);
  const pendingPositionTitleRef = useRef<{ id: string; title: string } | null>(null);

  const { run: updateElection, error: updateError } = useAsyncAction(
    useCallback(async () => {
      const updates = pendingUpdatesRef.current;
      if (!updates) return;
      const updated = await adminRepository.updateBoardElection(route.id, updates);
      if (updated) setElection(updated);
    }, [route.id]),
    { showSuccessToast: false, showErrorToast: false }
  );

  const { run: addPosition, loading: addingPosition, error: positionError } = useAsyncAction(
    useCallback(async () => {
      if (!newPositionTitle.trim()) return;
      await adminRepository.addElectionPosition(route.id, { title: newPositionTitle.trim() });
      setNewPositionTitle("");
      await load();
    }, [newPositionTitle, route.id, load]),
    { successMessage: "Position added.", showErrorToast: false }
  );

  const { run: removePositionRun, loading: removingPosition } = useAsyncAction(
    useCallback(async () => {
      const id = pendingPositionIdRef.current;
      if (!id) return;
      await adminRepository.removeElectionPosition(id);
      await load();
      setConfirmKind(null);
    }, [load]),
    { successMessage: "Position removed.", showErrorToast: false }
  );

  const { run: addCandidateRun, error: candidateError } = useAsyncAction(
    useCallback(async () => {
      const positionId = pendingPositionIdRef.current;
      if (!positionId) return;
      const draft = newCandidate.positionId === positionId ? newCandidate : newCandidate;
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
      await load();
    }, [newCandidate, load]),
    { successMessage: "Candidate added.", showErrorToast: false }
  );

  const { run: importApplicationRun } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingImportRef.current;
      if (!pending) return;
      const app = applications.find((a) => a.id === pending.applicationId);
      if (!app) return;
      await adminRepository.addElectionCandidate(pending.positionId, {
        name: app.residentName,
        unit: app.unit,
        bio: app.statement.slice(0, 200),
        applicationId: app.id,
      });
      await load();
    }, [applications, load]),
    { successMessage: "Candidate imported.", showErrorToast: false }
  );

  const { run: removeCandidateRun, loading: removingCandidate } = useAsyncAction(
    useCallback(async () => {
      const id = pendingCandidateIdRef.current;
      if (!id) return;
      await adminRepository.removeElectionCandidate(id);
      await load();
      setConfirmKind(null);
    }, [load]),
    { successMessage: "Candidate removed.", showErrorToast: false }
  );

  const { run: archiveElection, loading: archiving } = useAsyncAction(
    useCallback(async () => {
      await adminRepository.archiveBoardElection(route.id);
      onNavigate({ page: "board-elections" });
    }, [route.id, onNavigate]),
    { successMessage: "Election archived." }
  );

  const { run: updatePositionTitleRun } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingPositionTitleRef.current;
      if (!pending) return;
      await adminRepository.updateElectionPosition(pending.id, { title: pending.title });
      await load();
    }, [load]),
    { showSuccessToast: false, showErrorToast: false }
  );

  usePageContentBusy(!election);

  if (!election) {
    return null;
  }

  const update = (updates: Partial<BoardElection>) => {
    pendingUpdatesRef.current = updates;
    void updateElection();
  };

  const toggleResidentType = (type: string) => {
    const types = election.residentTypes.includes(type)
      ? election.residentTypes.filter((t) => t !== type)
      : [...election.residentTypes, type];
    update({ residentTypes: types });
  };

  const handleRemovePosition = (id: string) => {
    pendingPositionIdRef.current = id;
    setConfirmKind("position");
  };

  const handleAddCandidate = (positionId: string) => {
    pendingPositionIdRef.current = positionId;
    void addCandidateRun();
  };

  const handleImportApplication = (positionId: string, applicationId: string) => {
    pendingImportRef.current = { positionId, applicationId };
    void importApplicationRun();
  };

  const handleRemoveCandidate = (id: string) => {
    pendingCandidateIdRef.current = id;
    setConfirmKind("candidate");
  };

  const formError = updateError ?? positionError ?? candidateError;

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
              <ActionButton
                label="Publish / Schedule"
                variant="success"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => update({ status: "scheduled" })}
              />
            )}
            {(election.status === "active" || election.status === "scheduled") && (
              <ActionButton
                label="Close Early"
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => update({ status: "closed" })}
              />
            )}
            {election.status !== "archived" && (
              <ActionButton
                label="Archive"
                variant="secondary"
                loading={archiving}
                loadingLabel="Archiving…"
                onClick={() => void archiveElection()}
              />
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
          {formError ? <FormAlert message={formError} /> : null}
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
                      onChange={(e) => {
                        pendingPositionTitleRef.current = { id: pos.id, title: e.target.value };
                        void updatePositionTitleRun();
                      }}
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
                    <ActionButton
                      label="Add Candidate"
                      onClick={() => handleAddCandidate(pos.id)}
                    />
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
              <ActionButton
                label="Add Position"
                loading={addingPosition}
                loadingLabel="Adding…"
                onClick={() => void addPosition()}
              />
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

      <ConfirmModal
        open={confirmKind === "position"}
        onClose={() => {
          if (removingPosition) return;
          setConfirmKind(null);
          pendingPositionIdRef.current = null;
        }}
        title="Remove Position"
        message="Remove this position and all its candidates?"
        variant="danger"
        loading={removingPosition}
        onConfirm={() => void removePositionRun()}
      />

      <ConfirmModal
        open={confirmKind === "candidate"}
        onClose={() => {
          if (removingCandidate) return;
          setConfirmKind(null);
          pendingCandidateIdRef.current = null;
        }}
        title="Remove Candidate"
        message="Remove this candidate?"
        variant="danger"
        loading={removingCandidate}
        onConfirm={() => void removeCandidateRun()}
      />
    </>
  );
}
