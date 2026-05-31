import { useEffect, useState } from "react";
import { AdminPanelTable } from "../components/AdminPanelTable";
import { AdminPageActions } from "../components/AdminPageActions";
import { adminRepository } from "../data/adminRepository";
import type { AdminRoute } from "../navigation";
import type { ConsultationSubmission } from "../../resident/data/types";

type ConsultationLeadsPageProps = {
  route: AdminRoute & { page: "consultation-leads" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

export function ConsultationLeadsPage({
  route,
  onNavigate,
  refreshKey,
  onRefresh,
}: ConsultationLeadsPageProps) {
  const [items, setItems] = useState<ConsultationSubmission[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminRepository.getConsultationSubmissions().then(setItems);
  }, [refreshKey]);

  useEffect(() => {
    adminRepository.markAllConsultationSubmissionsRead().then(onRefresh);
  }, [onRefresh]);

  return (
    <>
      <AdminPageActions route={route} onNavigate={onNavigate} />
      <AdminPanelTable
        title="Consultation Leads"
        headerColor="green"
        data={items}
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        page={page}
        onPageChange={setPage}
        searchPlaceholder="Search consultation submissions"
        columns={[
          {
            key: "submittedAt",
            header: "Submitted",
            sortable: true,
            sortValue: (row) => row.submittedAt,
            render: (row) => new Date(row.submittedAt).toLocaleString(),
          },
          {
            key: "name",
            header: "Name",
            render: (row) => (
              <div>
                <p className="font-semibold text-slate-900">{row.name}</p>
                {row.unread && <p className="text-xs font-semibold text-emerald-600">New</p>}
              </div>
            ),
          },
          { key: "corporationNumber", header: "Corporation #", render: (row) => row.corporationNumber },
          { key: "municipalAddress", header: "Municipal Address", render: (row) => row.municipalAddress },
          { key: "email", header: "Email", render: (row) => row.email },
          { key: "phone", header: "Phone", render: (row) => row.phone },
          {
            key: "condoHealth",
            header: "Condo Health",
            render: (row) => row.survey.condoHealth,
          },
          {
            key: "management",
            header: "Management",
            render: (row) => row.survey.managementExperience,
          },
          {
            key: "changeIntent",
            header: "Change Intent",
            render: (row) => row.survey.consideringManagementChange,
          },
          {
            key: "painPoint",
            header: "Pain Point",
            render: (row) => (
              <p className="line-clamp-2 max-w-xs text-sm">{row.survey.currentPainPoint}</p>
            ),
          },
        ]}
      />
    </>
  );
}

