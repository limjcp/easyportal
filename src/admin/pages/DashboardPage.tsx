import { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { usePageContentBusy } from "../../shared/usePageContentBusy";
import { adminRepository } from "../data/adminRepository";
import type { AdminRoute } from "../navigation";
import type { BoardMember } from "../../resident/data/types";
import { formatDisplayDate, isTermExpiringSoon } from "../../resident/data/fireSafetyUtils";

type DashboardSummary = {
  buildingName: string;
  buildingAddress: string;
  unitsCount: number;
  floorCount: number;
  usersCount: number;
  imageUrl?: string;
};

type DashboardPageProps = {
  refreshKey: number;
  onNavigate: (route: AdminRoute) => void;
  unreadSuggestions: number;
  pendingApprovals: number;
  unreadBoardApplications: number;
  unreadConsultationLeads: number;
};

export function DashboardPage({
  refreshKey,
  onNavigate,
  unreadSuggestions,
  pendingApprovals,
  unreadBoardApplications,
  unreadConsultationLeads,
}: DashboardPageProps) {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    adminRepository.getBoardMembers().then(setBoardMembers);
    adminRepository.getDashboardSummary().then(setSummary);
  }, [refreshKey]);

  usePageContentBusy(summary === null);

  const heroBackground = summary?.imageUrl
    ? `linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 50%, transparent 100%), url(${summary.imageUrl})`
    : "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%), url('/images/building-card.svg')";

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_1.1fr_1fr]">
      <PanelCard title="Messages">
        <div className="space-y-4 text-sm">
          <MessageRow
            count={unreadSuggestions}
            label="New Suggestion(s)"
            color="bg-lime-500"
            onClick={() => onNavigate({ page: "suggestions" })}
          />
          <MessageRow
            count={pendingApprovals}
            label="Board Approval(s) Pending Vote"
            color="bg-slate-800"
            onClick={() => onNavigate({ page: "board-approvals", tab: "current" })}
          />
          <MessageRow
            count={unreadBoardApplications}
            label="New Board Member Application(s)"
            color="bg-[#3476ef]"
            onClick={() => onNavigate({ page: "board-members", tab: "applications" })}
          />
          <MessageRow
            count={unreadConsultationLeads}
            label="New Consultation Lead(s)"
            color="bg-emerald-600"
            onClick={() => onNavigate({ page: "consultation-leads" })}
          />
        </div>
      </PanelCard>
      <PanelCard title="Board Members">
        <div className="space-y-3">
          {boardMembers.map((member, index) => (
            <div
              key={member.id}
              className="flex items-start gap-3 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0"
            >
              <FaUserCircle className="mt-0.5 text-4xl text-slate-300" />
              <div>
                <div className="flex items-center gap-2">
                  {index > 0 && <span className="h-2 w-2 rounded-full bg-lime-500" />}
                  <p className="font-semibold text-[#3eb5cb]">{member.name}</p>
                </div>
                <p className="text-xs text-slate-500">{member.role}</p>
                <p
                  className={`text-xs ${isTermExpiringSoon(member.termEndDate) ? "font-medium text-amber-700" : "text-slate-400"}`}
                >
                  Term expires {formatDisplayDate(member.termEndDate)}
                </p>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onNavigate({ page: "board-members", tab: "applications" })}
            className="text-xs text-[#3476ef] hover:underline"
          >
            View applications →
          </button>
        </div>
      </PanelCard>
      <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
        <div
          className="relative h-36 bg-cover bg-center"
          style={{
            backgroundImage: heroBackground,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-4 px-4 text-center text-white">
            <p className="text-[15px] font-semibold leading-tight">
              {summary?.buildingAddress ?? "Loading building…"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
          <StatItem label="Units" value={String(summary?.unitsCount ?? "—")} />
          <StatItem label="Areas/ Floors" value={String(summary?.floorCount ?? "—")} />
          <StatItem label="Users" value={String(summary?.usersCount ?? "—")} />
        </div>
      </div>
    </div>
  );
}

function PanelCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-slate-300 bg-white shadow-sm">
      <div className="border-b border-slate-300 px-4 py-2 text-lg font-semibold text-slate-700">{title}</div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function MessageRow({
  count,
  label,
  color,
  onClick,
}: {
  count: number;
  label: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-slate-200 pb-3 text-left last:border-b-0 last:pb-0"
    >
      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${color}`}>
        {count}
      </span>
      <span className="text-[#28a7dd]">{label}</span>
    </button>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="text-3xl font-light text-[#4a6686]">{value}</div>
    </div>
  );
}
