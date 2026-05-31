import { useEffect, useState } from "react";
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
  const [saving, setSaving] = useState(false);

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
  }, [route.id]);

  if (!application) {
    return <div className="py-8 text-center text-slate-500">Loading...</div>;
  }

  const handleSaveStatus = async () => {
    setSaving(true);
    await adminRepository.updateBoardMemberApplicationStatus(route.id, status);
    const updated = await adminRepository.getBoardMemberApplicationById(route.id);
    if (updated) setApplication(updated);
    setSaving(false);
    onRefresh();
  };

  return (
    <>
      <AdminPageActions route={route} onNavigate={onNavigate} />

      <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
        <AdminPanelHeader title="Board Member Application" color="purple" />

        <div className="space-y-4 p-4">
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

          <button
            type="button"
            onClick={handleSaveStatus}
            disabled={saving}
            className="rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Update Status"}
          </button>
        </div>
      </div>
    </>
  );
}
