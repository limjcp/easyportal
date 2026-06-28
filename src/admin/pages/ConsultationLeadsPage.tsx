import { useEffect, useState } from "react";
import { AdminPanelTable } from "../components/AdminPanelTable";
import { AdminMobileCard } from "../components/AdminMobileCard";
import { UnreadBadge } from "../components/AdminBadges";
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

function formatSurveyValue(value: string | undefined) {
  if (!value) return "—";
  return value.replace(/-/g, " ");
}

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
          { key: "email", header: "Email", render: (row) => row.email },
          { key: "phone", header: "Phone", render: (row) => row.phone || "—" },
          {
            key: "condoType",
            header: "Condo Type",
            render: (row) => formatSurveyValue(row.survey.condoType),
          },
          {
            key: "unitCount",
            header: "Units",
            render: (row) => formatSurveyValue(row.survey.unitCount),
          },
          {
            key: "yourRole",
            header: "Role",
            render: (row) => formatSurveyValue(row.survey.yourRole),
          },
          {
            key: "region",
            header: "Region",
            render: (row) => formatSurveyValue(row.survey.region),
          },
          {
            key: "condoHealth",
            header: "Condo Health",
            render: (row) => formatSurveyValue(row.survey.condoHealth),
          },
          {
            key: "management",
            header: "Management",
            render: (row) => formatSurveyValue(row.survey.managementExperience),
          },
          {
            key: "topConcern",
            header: "Top Concern",
            render: (row) =>
              formatSurveyValue(row.survey.topConcern ?? row.survey.currentPainPoint),
          },
          {
            key: "changeIntent",
            header: "Change Intent",
            render: (row) => formatSurveyValue(row.survey.consideringManagementChange),
          },
        ]}
        mobileCard={(row) => (
          <AdminMobileCard
            title={
              <span className="flex items-center gap-2">
                {row.name}
                {row.unread ? <UnreadBadge /> : null}
              </span>
            }
            subtitle={new Date(row.submittedAt).toLocaleString()}
            fields={[
              { label: "Email", value: row.email },
              { label: "Phone", value: row.phone || "—" },
              { label: "Condo type", value: formatSurveyValue(row.survey.condoType) },
              { label: "Units", value: formatSurveyValue(row.survey.unitCount) },
              { label: "Role", value: formatSurveyValue(row.survey.yourRole) },
              { label: "Region", value: formatSurveyValue(row.survey.region) },
              { label: "Health", value: formatSurveyValue(row.survey.condoHealth) },
              {
                label: "Management",
                value: formatSurveyValue(row.survey.managementExperience),
              },
              {
                label: "Top concern",
                value: formatSurveyValue(row.survey.topConcern ?? row.survey.currentPainPoint),
              },
              {
                label: "Change intent",
                value: formatSurveyValue(row.survey.consideringManagementChange),
              },
            ]}
            highlight={row.unread}
          />
        )}
      />
    </>
  );
}
