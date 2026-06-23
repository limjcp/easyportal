import { useCallback, useRef, useState } from "react";
import { CrudPanel } from "../../shared/CrudPanel";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { useLocalList } from "../../shared/useLocalList";
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
  const { data: items, reload, loading } = useLocalList(
    useCallback(() => adminRepository.getFaqs(), []),
    refreshKey
  );
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const pendingFaqRef = useRef<{ id: string; answer?: string } | null>(null);
  const pendingCreateRef = useRef<{ question: string; answer: string } | null>(null);

  const { run: createFaqRun } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingCreateRef.current;
      if (!pending) return;
      await adminRepository.createFaq(pending);
      onRefresh();
      await reload();
    }, [onRefresh, reload]),
    { successMessage: "FAQ added." }
  );

  const { run: updateFaqRun, error: updateError } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingFaqRef.current;
      if (!pending?.answer) return;
      await adminRepository.updateFaq(pending.id, { answer: pending.answer });
      onRefresh();
      await reload();
    }, [onRefresh, reload]),
    { successMessage: "FAQ updated.", showErrorToast: false }
  );

  const { run: deleteFaqRun, error: deleteError } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingFaqRef.current;
      if (!pending) return;
      await adminRepository.deleteFaq(pending.id);
      onRefresh();
      await reload();
    }, [onRefresh, reload]),
    { successMessage: "FAQ deleted." }
  );

  const actionError = updateError ?? deleteError;

  return (
    <CrudPanel loading={loading}>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <button type="button" onClick={() => setAddOpen(true)} className="rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white">
            + Add FAQ
          </button>
        }
      />
      {actionError ? <FormAlert message={actionError} className="mb-3" /> : null}
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
                      if (answer !== null) {
                        pendingFaqRef.current = { id: row.id, answer };
                        void updateFaqRun();
                      }
                    },
                  },
                  {
                    label: "Delete",
                    onClick: () => {
                      pendingFaqRef.current = { id: row.id };
                      void deleteFaqRun();
                    },
                  },
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
          pendingCreateRef.current = faq;
          await createFaqRun();
        }}
      />
    </CrudPanel>
  );
}
