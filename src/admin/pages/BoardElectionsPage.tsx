import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "../components/AdminBadges";
import { AdminPanelTable } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AddElectionModal } from "../modals/AddElectionModal";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type { BoardElection } from "../../resident/data/types";

type ElectionRow = BoardElection & {
  positionCount: number;
  ballotCount: number;
  eligibleUnits: number;
};

type BoardElectionsPageProps = {
  route: AdminRoute & { page: "board-elections" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

export function BoardElectionsPage({
  route,
  onNavigate,
  refreshKey,
  onRefresh,
}: BoardElectionsPageProps) {
  const [rows, setRows] = useState<ElectionRow[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      adminRepository.getBoardElections(),
      adminRepository.getEligibleUnitCount(),
    ]).then(async ([elections, eligibleUnits]) => {
      const enriched = await Promise.all(
        elections.map(async (election) => {
          const [positions, ballots] = await Promise.all([
            adminRepository.getElectionPositions(election.id),
            adminRepository.getElectionBallots(election.id),
          ]);
          return {
            ...election,
            positionCount: positions.length,
            ballotCount: ballots.length,
            eligibleUnits,
          };
        })
      );
      setRows(enriched);
    });
  }, [refreshKey]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  return (
    <>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white hover:bg-[#2d68cf]"
          >
            + Add Election
          </button>
        }
      />
      <AdminPanelTable
        title="Board Elections"
        data={filtered}
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        page={page}
        onPageChange={setPage}
        filters={[
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "View All" },
              { value: "draft", label: "Draft" },
              { value: "scheduled", label: "Scheduled" },
              { value: "active", label: "Active" },
              { value: "closed", label: "Closed" },
              { value: "archived", label: "Archived" },
            ],
          },
        ]}
        columns={[
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: "title",
            header: "Title",
            render: (row) => (
              <button
                type="button"
                onClick={() => onNavigate({ page: "board-election-edit", id: row.id })}
                className="text-[#3476ef] hover:underline"
              >
                {row.title}
              </button>
            ),
          },
          { key: "opens", header: "Opens", render: (row) => row.opensAt },
          { key: "closes", header: "Closes", render: (row) => row.closesAt },
          { key: "positions", header: "Positions", render: (row) => row.positionCount },
          {
            key: "ballots",
            header: "Ballots",
            render: (row) => `${row.ballotCount} / ${row.eligibleUnits * row.positionCount || row.eligibleUnits}`,
          },
        ]}
      />

      <AddElectionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onContinue={async (title) => {
          const election = await adminRepository.createBoardElection({ title });
          setAddOpen(false);
          onRefresh();
          onNavigate({ page: "board-election-edit", id: election.id });
        }}
      />
    </>
  );
}
