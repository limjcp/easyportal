import { useCallback, useEffect, useState } from "react";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { AdminPanelHeader } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type { BoardMemberApplication } from "../../resident/data/types";

type BoardApplicationDetailPageProps = {
  route: AdminRoute & { page: "board-application-detail" };
  onNavigate: (route: AdminRoute) => void;
  onRefresh: () => void;
};

const STATUS_OPTIONS: BoardMemberApplication["status"][] = [
  "Submitted",
  "Under Review",
  "Approved",
  "Declined",
];

export function BoardApplicationDetailPage({
  route,
  onNavigate,
  onRefresh,
}: BoardApplicationDetailPageProps) {
  const [application, setApplication] = useState<BoardMemberApplication | null>(null);
  const [status, setStatus] = useState<BoardMemberApplication["status"]>("Submitted");

  useEffect(() => {
    adminRepository.getBoardMemberApplicationById(route.id).then((app) => {
      if (app) {
        setApplication(app);
        setStatus(app.status);
        if (app.unread) {
          adminRepository.markBoardApplicationRead(app.id).then(() => onRefresh());
        }
      }
    });
  }, [route.id, onRefresh]);

  const { run: handleSaveStatus, loading: saving, error } = useAsyncAction(
    useCallback(async () => {
      await adminRepository.updateBoardMemberApplicationStatus(route.id, status);
      const updated = await adminRepository.getBoardMemberApplicationById(route.id);
      if (updated) setApplication(updated);
      onRefresh();
    }, [route.id, status, onRefresh]),
    { successMessage: "Application status updated.", showErrorToast: false }
  );

  if (!application) {
    return <div className="py-8 text-center text-slate-500">Loading...</div>;
  }

  return (
    <>
      <AdminPageActions route={route} onNavigate={onNavigate} />

      <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
        <AdminPanelHeader title="Board Member Application" color="purple" />

        <div className="space-y-4 p-4">
          {error ? <FormAlert message={error} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Applicant</p>
              <p className="text-sm font-medium text-slate-800">{application.residentName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Unit</p>
              <p className="text-sm text-slate-800">{application.unit}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm text-slate-800">{application.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-sm text-slate-800">{application.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Submitted</p>
              <p className="text-sm text-slate-800">{application.submittedAt}</p>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs text-slate-500">Statement of interest</p>
            <p className="whitespace-pre-wrap rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {application.statement}
            </p>
          </div>

          <label className="block max-w-xs text-sm">
            <span className="font-medium text-slate-700">Application status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BoardMemberApplication["status"])}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <ActionButton
            label="Update Status"
            loadingLabel="Saving…"
            loading={saving}
            onClick={() => void handleSaveStatus()}
          />
        </div>
      </div>
    </>
  );
}
