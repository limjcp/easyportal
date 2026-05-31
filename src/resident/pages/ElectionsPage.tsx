import { useEffect, useState } from "react";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { residentRepo } from "../data/mockRepository";
import type { BoardElection } from "../data/types";
import type { ResidentRoute } from "../navigation";

type ElectionSummary = BoardElection & {
  positionCount: number;
  votedCount: number;
};

function isDirectorPosition(title: string): boolean {
  return /\bdirector\b/i.test(title);
}

export function ElectionsPage({ onNavigate }: { onNavigate: (route: ResidentRoute) => void }) {
  const [elections, setElections] = useState<ElectionSummary[]>([]);

  useEffect(() => {
    Promise.all([residentRepo.getElectionsForResident(), residentRepo.getUser()]).then(
      async ([items, user]) => {
        const enriched = await Promise.all(
          items.map(async (election) => {
            const [positions, ballots] = await Promise.all([
              residentRepo.getElectionPositions(election.id),
              residentRepo.getBallotsForUnit(election.id, user.unit),
            ]);
            const directorPositionIds = new Set(
              positions.filter((position) => isDirectorPosition(position.title)).map((position) => position.id)
            );
            return {
              ...election,
              positionCount: directorPositionIds.size,
              votedCount: ballots.filter((ballot) => directorPositionIds.has(ballot.positionId)).length,
            };
          })
        );
        setElections(enriched);
      }
    );
  }, []);

  return (
    <div className="space-y-4">
      <ModuleMessageBanner moduleId="boardElections" />
      {elections.length === 0 ? (
        <p className="rounded-sm bg-white/95 p-6 text-center text-slate-600 shadow-lg">
          No elections are available at this time.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {elections.map((election) => {
            const complete =
              election.positionCount > 0 && election.votedCount >= election.positionCount;
            const canVote = election.status === "active" && !complete;
            return (
              <div
                key={election.id}
                className="rounded-sm bg-white/95 p-5 shadow-lg"
              >
                <h2 className="text-lg font-semibold text-slate-800">{election.title}</h2>
                {election.description && (
                  <p className="mt-2 text-sm text-slate-600">{election.description}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  {election.opensAt} — {election.closesAt}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {election.votedCount} of {election.positionCount} position
                  {election.positionCount !== 1 ? "s" : ""} voted
                </p>
                <span
                  className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                    election.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : election.status === "closed"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                </span>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate({ page: "board-election-vote", electionId: election.id })
                    }
                    className="rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf]"
                  >
                    {canVote ? "Vote" : complete ? "View ballot" : "View election"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
