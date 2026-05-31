import { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { AdminPanelTable, AdminTabs } from "../components/AdminPanelTable";
import { UnreadBadge } from "../components/AdminBadges";
import { AdminPageActions } from "../components/AdminPageActions";
import { adminRepository } from "../data/adminRepository";
import { formatDisplayDate, isTermExpiringSoon } from "../../resident/data/fireSafetyUtils";
import type { AdminRoute } from "../navigation";
import type { BoardMember, BoardMemberApplication } from "../../resident/data/types";

type BoardMembersPageProps = {
  route: AdminRoute & { page: "board-members" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
};

export function BoardMembersPage({ route, onNavigate, refreshKey }: BoardMembersPageProps) {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [applications, setApplications] = useState<BoardMemberApplication[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    adminRepository.getBoardMembers().then(setMembers);
    adminRepository.getBoardMemberApplications().then(setApplications);
    setPage(1);
  }, [refreshKey, route.tab]);

  const filteredApps =
    statusFilter === "all"
      ? applications
      : applications.filter((a) => a.status.toLowerCase().replace(" ", "-") === statusFilter);

  const panelTitle = route.tab === "members" ? "Current Board Members" : "Board Member Applications";

  return (
    <>
      <AdminPageActions route={route} onNavigate={onNavigate} />

      <AdminTabs
        tabs={[
          { id: "members", label: "Current Members" },
          { id: "applications", label: "Applications" },
        ]}
        activeTab={route.tab}
        onChange={(tab) => onNavigate({ page: "board-members", tab: tab as "members" | "applications" })}
      />

      <AdminPanelTable
        title={panelTitle}
        headerColor="purple"
        data={route.tab === "members" ? members : filteredApps}
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        page={page}
        onPageChange={setPage}
        filters={
          route.tab === "applications"
            ? [
                {
                  id: "status",
                  label: "Status",
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: [
                    { value: "all", label: "View All" },
                    { value: "submitted", label: "Submitted" },
                    { value: "under-review", label: "Under Review" },
                    { value: "approved", label: "Approved" },
                    { value: "declined", label: "Declined" },
                  ],
                },
              ]
            : undefined
        }
        columns={
          route.tab === "members"
            ? [
                {
                  key: "name",
                  header: "Member",
                  render: (row: BoardMember) => (
                    <div className="flex items-center gap-2">
                      <FaUserCircle className="text-xl text-slate-300" />
                      <span>{row.name}</span>
                    </div>
                  ),
                },
                { key: "unit", header: "Unit", render: (row: BoardMember) => row.unit },
                { key: "role", header: "Role", render: (row: BoardMember) => row.role },
                {
                  key: "termEndDate",
                  header: "Term Expires",
                  render: (row: BoardMember) => {
                    const soon = isTermExpiringSoon(row.termEndDate);
                    return (
                      <span className={soon ? "font-medium text-amber-700" : undefined}>
                        {formatDisplayDate(row.termEndDate)}
                        {soon && " (soon)"}
                      </span>
                    );
                  },
                },
              ]
            : [
                {
                  key: "id",
                  header: "ID",
                  render: (row: BoardMemberApplication) => (
                    <span>
                      {row.id}
                      {row.unread && <UnreadBadge />}
                    </span>
                  ),
                },
                { key: "submittedAt", header: "Submitted", render: (row: BoardMemberApplication) => row.submittedAt },
                { key: "residentName", header: "Applicant", render: (row: BoardMemberApplication) => row.residentName },
                { key: "unit", header: "Unit", render: (row: BoardMemberApplication) => row.unit },
                { key: "email", header: "Email", render: (row: BoardMemberApplication) => row.email },
                { key: "status", header: "Status", render: (row: BoardMemberApplication) => row.status },
                {
                  key: "action",
                  header: "Action",
                  render: (row: BoardMemberApplication) => (
                    <button
                      type="button"
                      onClick={() => onNavigate({ page: "board-application-detail", id: row.id })}
                      className="text-[#3476ef] hover:underline"
                    >
                      View
                    </button>
                  ),
                },
              ]
        }
      />
    </>
  );
}
