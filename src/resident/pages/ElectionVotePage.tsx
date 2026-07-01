import { useCallback, useEffect, useState } from "react";
import { residentRepo } from "../data/residentRepository";
import type {
  BoardElection,
  ElectionBallot,
  ElectionCandidate,
  ElectionPosition,
} from "../data/types";
import type { ResidentRoute } from "../navigation";

type ElectionVotePageProps = {
  electionId: string;
  onNavigate: (route: ResidentRoute) => void;
};

function isDirectorPosition(title: string): boolean {
  return /\bdirector\b/i.test(title);
}

export function ElectionVotePage({ electionId, onNavigate }: ElectionVotePageProps) {
  const [election, setElection] = useState<BoardElection | null>(null);
  const [positions, setPositions] = useState<ElectionPosition[]>([]);
  const [candidatesByPosition, setCandidatesByPosition] = useState<Record<string, ElectionCandidate[]>>({});
  const [ballots, setBallots] = useState<ElectionBallot[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [e, pos, userBallots] = await Promise.all([
      residentRepo.getElectionById(electionId),
      residentRepo.getElectionPositions(electionId),
      residentRepo.getUser().then((u) => residentRepo.getBallotsForUnit(electionId, u.unit)),
    ]);
    const directorPositions = pos.filter((position) => isDirectorPosition(position.title));
    setElection(e);
    setPositions(directorPositions);
    setBallots(userBallots);
    const candMap: Record<string, ElectionCandidate[]> = {};
    await Promise.all(
      directorPositions.map(async (p) => {
        candMap[p.id] = await residentRepo.getCandidatesForPosition(p.id);
      })
    );
    setCandidatesByPosition(candMap);
  }, [electionId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!election) {
    return <div className="py-8 text-center text-slate-500">Loading...</div>;
  }

  const ballotByPosition = Object.fromEntries(ballots.map((b) => [b.positionId, b]));

  const handleVote = async (positionId: string) => {
    const position = positions.find((item) => item.id === positionId);
    if (!position || !isDirectorPosition(position.title)) {
      setError("Only Director positions are available for resident voting.");
      return;
    }
    const candidateId = selected[positionId];
    if (!candidateId) {
      setError("Please select a candidate.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await residentRepo.castElectionVote({
        electionId,
        positionId,
        candidateId,
      });
      await load();
      setSelected((s) => {
        const next = { ...s };
        delete next[positionId];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit vote.");
    } finally {
      setSubmitting(false);
    }
  };

  const votingOpen = election.status === "active";

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => onNavigate({ page: "board-elections" })}
        className="text-sm text-[#3476ef] hover:underline"
      >
        ← Back to elections
      </button>

      <div className="rounded-sm bg-white/95 p-5 shadow-lg sm:p-6">
        <h1 className="text-xl font-semibold text-slate-800">{election.title}</h1>
        {election.description && (
          <p className="mt-2 text-sm text-slate-600">{election.description}</p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Voting period: {election.opensAt} — {election.closesAt}
        </p>
        {!votingOpen && election.status !== "closed" && (
          <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Voting is not open yet. Check back during the voting period.
          </p>
        )}
        {election.status === "closed" && (
          <p className="mt-3 rounded bg-slate-100 px-3 py-2 text-sm text-slate-700">
            This election is closed.
          </p>
        )}
      </div>

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {positions.length === 0 && (
        <div className="rounded-sm bg-white/95 p-5 shadow-lg">
          <p className="text-sm text-slate-700">
            No Director positions are available in this election. Residents can only vote for
            Director positions.
          </p>
        </div>
      )}

      {positions.map((pos) => {
        const existing = ballotByPosition[pos.id];
        const candidates = candidatesByPosition[pos.id] ?? [];
        const votedCandidate = existing
          ? candidates.find((c) => c.id === existing.candidateId)
          : null;

        return (
          <div key={pos.id} className="rounded-sm bg-white/95 p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800">{pos.title}</h2>

            {existing && votedCandidate ? (
              <p className="mt-3 text-sm text-slate-700">
                You voted for <strong>{votedCandidate.name}</strong> (Unit {votedCandidate.unit}
                ).
              </p>
            ) : candidates.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No candidates for this position.</p>
            ) : votingOpen ? (
              <div className="mt-4 space-y-2">
                {candidates.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-start gap-3 rounded border border-slate-200 px-3 py-3 hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name={`position-${pos.id}`}
                      value={c.id}
                      checked={selected[pos.id] === c.id}
                      onChange={() => setSelected((s) => ({ ...s, [pos.id]: c.id }))}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-medium text-slate-800">{c.name}</span>
                      <span className="text-slate-500"> — Unit {c.unit}</span>
                      {c.bio && <p className="mt-1 text-sm text-slate-600">{c.bio}</p>}
                    </div>
                  </label>
                ))}
                <button
                  type="button"
                  disabled={submitting || !selected[pos.id]}
                  onClick={() => handleVote(pos.id)}
                  className="mt-2 rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Submit vote for {pos.title}
                </button>
              </div>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {candidates.map((c) => (
                  <li key={c.id}>
                    {c.name} — Unit {c.unit}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
