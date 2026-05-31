import { useEffect, useState } from "react";
import { OptionsDropdown } from "../components/AdminBadges";
import { AdminPanelTable } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AddFaqModal } from "../modals/AddFaqModal";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type { FaqItem } from "../../resident/data/types";

type AdminFaqPageProps = {
  route: AdminRoute & { page: "faq" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

export function AdminFaqPage({ route, onNavigate, refreshKey, onRefresh }: AdminFaqPageProps) {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    adminRepository.getFaqs().then(setItems);
  }, [refreshKey]);

  return (
    <>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <button type="button" onClick={() => setAddOpen(true)} className="rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white">
            + Add FAQ
          </button>
        }
      />
      <AdminPanelTable
        title="FAQ"
        data={items}
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        page={page}
        onPageChange={setPage}
        columns={[
          { key: "question", header: "Question", render: (row) => row.question },
          { key: "answer", header: "Answer", render: (row) => <p className="line-clamp-2 max-w-md">{row.answer}</p> },
          {
            key: "options",
            header: "Options",
            render: (row) => (
              <OptionsDropdown
                options={[
                  {
                    label: "Edit",
                    onClick: () => {
                      const answer = prompt("Edit answer:", row.answer);
                      if (answer !== null) adminRepository.updateFaq(row.id, { answer }).then(onRefresh);
                    },
                  },
                  { label: "Delete", onClick: () => adminRepository.deleteFaq(row.id).then(onRefresh) },
                ]}
              />
            ),
          },
        ]}
      />
      <AddFaqModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (faq) => {
          await adminRepository.createFaq(faq);
          onRefresh();
        }}
      />
    </>
  );
}
