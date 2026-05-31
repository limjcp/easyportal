import { cn } from "../../utils/cn";
import { MASTER_REPORT_HUB_TILES } from "../config/masterReportHubTiles";
import type { CompanyRoute } from "../navigation";
import type { MasterReportTab, MasterReportType } from "../../resident/data/types";

type MasterReportHubPanelProps = {
  onNavigate: (route: CompanyRoute) => void;
  activeReportType?: MasterReportType;
};

export function MasterReportHubPanel({ onNavigate, activeReportType }: MasterReportHubPanelProps) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
      <div className="p-4 pb-0">
        <h4 className="mt-1 text-base font-semibold text-slate-800">
          Management Company Master Reports:
        </h4>
        <p className="mt-1 text-sm text-slate-600">
          Reports in this area consolidate information across all your properties
        </p>
        <hr className="mb-4 mt-3 border-slate-200" />
      </div>

      <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
        {MASTER_REPORT_HUB_TILES.map((tile) => {
          const Icon = tile.icon;
          const isActive = activeReportType === tile.id;
          return (
            <button
              key={tile.id}
              type="button"
              onClick={() =>
                onNavigate({
                  page: "master-report-detail",
                  reportType: tile.id,
                  tab: "current" as MasterReportTab,
                })
              }
              className={cn(
                tile.btnClass,
                "w-full rounded-sm p-0 text-left text-white shadow transition",
                isActive && "ring-2 ring-black ring-offset-1"
              )}
            >
              <div className="flex items-center px-3 py-4">
                <div className="w-1/4 shrink-0">
                  <Icon className="text-2xl" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 pl-2">
                  <h5 className="text-sm font-semibold leading-tight">{tile.label}</h5>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
