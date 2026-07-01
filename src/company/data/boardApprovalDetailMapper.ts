import type { BoardApprovalDetail, MasterReportRow } from "../../resident/data/types";

export function boardApprovalDetailFromRow(row: MasterReportRow): BoardApprovalDetail {
  const collected = row.votesCollected ?? 0;
  const required = row.votesRequired ?? 0;
  const approved = row.approvedCount ?? 0;
  const disapproved = row.disapprovedCount ?? 0;

  return {
    id: row.id,
    title: row.title,
    buildingLabel: row.buildingLabel,
    status: row.status,
    createdBy: "Management",
    dateCreated: row.date,
    description: row.title,
    approvedCount: approved,
    disapprovedCount: disapproved,
    votesCollected: collected,
    votesRequired: required,
    votes: [],
    attachments: [],
    comments: [],
    archived: row.archived,
    unread: row.unread,
  };
}
