import type { AdminTableColumn } from "../../admin/components/AdminPanelTable";
import { OptionsDropdown, StatusBadge } from "../../admin/components/AdminBadges";
import { cn } from "../../utils/cn";
import type { MasterReportRow } from "../../resident/data/types";

function CreatedCell({ row }: { row: MasterReportRow }) {
  return (
    <div className={cn("text-center", row.unread && "font-semibold")}>
      {row.unread && (
        <span className="mb-1 block">
          <span className="inline-block rounded bg-slate-800 px-2 py-0.5 text-xs text-white">Unread</span>
        </span>
      )}
      {row.date}
    </div>
  );
}

function VotesCollectedCell({ row }: { row: MasterReportRow }) {
  const collected = row.votesCollected ?? 0;
  const required = row.votesRequired ?? 0;
  return (
    <div className={cn("text-center", row.unread && "font-semibold")}>
      <strong>{collected}</strong> of <strong>{required}</strong> Collected
    </div>
  );
}

function ActionsCell({
  row,
  onView,
  onRemind,
}: {
  row: MasterReportRow;
  onView: (row: MasterReportRow) => void;
  onRemind: (row: MasterReportRow) => void;
}) {
  const showOptions = row.status === "Pending";

  if (!showOptions) {
    return (
      <button
        type="button"
        onClick={() => onView(row)}
        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
      >
        View
      </button>
    );
  }

  return (
    <OptionsDropdown
      options={[
        { label: "View Board Approval", onClick: () => onView(row) },
        { label: "Send Vote Reminders", onClick: () => onRemind(row) },
      ]}
    />
  );
}

export function getBoardApprovalColumns(
  onView: (row: MasterReportRow) => void,
  onRemind: (row: MasterReportRow) => void
): AdminTableColumn<MasterReportRow>[] {
  return [
    {
      key: "created",
      header: "Created",
      className: "text-center",
      render: (r) => <CreatedCell row={r} />,
      sortValue: (r) => r.date,
    },
    {
      key: "property",
      header: "Property",
      render: (r) => <span className={cn(r.unread && "font-semibold")}>{r.buildingLabel}</span>,
      sortValue: (r) => r.buildingLabel,
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (r) => <StatusBadge status={r.status} />,
      sortValue: (r) => r.status,
    },
    {
      key: "approved",
      header: "✓",
      className: "text-center",
      render: (r) => (
        <div className="text-center font-bold text-green-600">{r.approvedCount ?? 0}</div>
      ),
      sortValue: (r) => r.approvedCount ?? 0,
    },
    {
      key: "disapproved",
      header: "✕",
      className: "text-center",
      render: (r) => (
        <div className="text-center font-bold text-red-600">{r.disapprovedCount ?? 0}</div>
      ),
      sortValue: (r) => r.disapprovedCount ?? 0,
    },
    {
      key: "votes",
      header: "Votes Collected",
      className: "text-center",
      render: (r) => <VotesCollectedCell row={r} />,
      sortValue: (r) => r.votesCollected ?? 0,
      hideBelow: "md",
    },
    {
      key: "title",
      header: "Title",
      render: (r) => <span className={cn(r.unread && "font-semibold")}>{r.title}</span>,
      sortValue: (r) => r.title,
      className: "max-w-[18rem]",
    },
    {
      key: "actions",
      header: "",
      className: "text-center",
      render: (r) => <ActionsCell row={r} onView={onView} onRemind={onRemind} />,
    },
  ];
}
