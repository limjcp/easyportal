import { useEffect, useMemo, useState } from "react";
import { DeliveryBadge, OptionsDropdown, StatusBadge } from "../components/AdminBadges";
import { AdminPanelTable } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AddNewsletterModal } from "../modals/AddNewsletterModal";
import { EmailNoticesReportModal } from "../modals/EmailNoticesReportModal";
import { NewsletterTemplateModal } from "../modals/NewsletterTemplateModal";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type { AdminNewsletter } from "../../resident/data/types";

function bodyPreview(body: string) {
  const plain = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "";
  return plain.length <= 48 ? plain : `${plain.slice(0, 48)}...`;
}

type NewslettersPageProps = {
  route: AdminRoute & { page: "newsletters" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

export function NewslettersPage({ route, onNavigate, refreshKey, onRefresh }: NewslettersPageProps) {
  const [items, setItems] = useState<AdminNewsletter[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templatesMenuOpen, setTemplatesMenuOpen] = useState(false);
  const [emailReportItem, setEmailReportItem] = useState<AdminNewsletter | null>(null);

  useEffect(() => {
    setPage(1);
    adminRepository.getNewsletters().then(setItems);
  }, [refreshKey]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      return true;
    });
  }, [items, statusFilter]);

  const openEdit = (row: AdminNewsletter) => {
    onNavigate({ page: "newsletter-edit", id: row.id });
  };

  return (
    <>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setTemplatesMenuOpen((v) => !v)}
                className="inline-flex items-center gap-1 rounded bg-[#79d0df] px-3 py-1.5 text-sm text-white hover:bg-[#6ac5d5]"
              >
                Edit Templates
                <span className="text-xs">▾</span>
              </button>
              {templatesMenuOpen && (
                <ul className="absolute right-0 z-20 mt-1 min-w-[12rem] rounded border border-slate-200 bg-white py-1 text-sm shadow-lg">
                  <li>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                      onClick={() => {
                        setTemplatesMenuOpen(false);
                        setTemplateOpen(true);
                      }}
                    >
                      + Add a New Template
                    </button>
                  </li>
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white hover:bg-[#2d68cf]"
            >
              + Add a New Newsletter
            </button>
          </div>
        }
      />
      <AdminPanelTable
        title="Newsletters"
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
              { value: "active", label: "Active" },
            ],
          },
        ]}
        columns={[
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge status={row.status} />,
          },
          { key: "date", header: "Date", render: (row) => row.date },
          {
            key: "title",
            header: "Title/Body",
            render: (row) => (
              <div>
                <p className="font-semibold text-slate-800">{row.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{bodyPreview(row.body)}</p>
              </div>
            ),
          },
          {
            key: "email",
            header: "Email Notices",
            render: (row) =>
              row.emailTotal > 0 ? (
                <button
                  type="button"
                  onClick={() => setEmailReportItem(row)}
                  className="inline-block"
                >
                  <DeliveryBadge delivered={row.emailDelivered} total={row.emailTotal} />
                </button>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            key: "options",
            header: "",
            render: (row) =>
              row.status === "draft" ? (
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  View
                </button>
              ) : (
                <OptionsDropdown
                  options={[
                    {
                      label: "View/Edit Newsletter",
                      onClick: () => openEdit(row),
                    },
                    ...(row.emailTotal > 0
                      ? [
                          {
                            label: "View Email Notices Report",
                            onClick: () => setEmailReportItem(row),
                          },
                        ]
                      : []),
                  ]}
                />
              ),
          },
        ]}
      />

      <AddNewsletterModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onContinue={async (title) => {
          const item = await adminRepository.createNewsletter(title);
          setAddOpen(false);
          onRefresh();
          onNavigate({ page: "newsletter-edit", id: item.id });
        }}
      />

      <NewsletterTemplateModal open={templateOpen} onClose={() => setTemplateOpen(false)} />

      <EmailNoticesReportModal
        open={!!emailReportItem}
        item={emailReportItem}
        onClose={() => setEmailReportItem(null)}
      />
    </>
  );
}