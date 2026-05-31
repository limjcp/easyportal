import { useEffect, useMemo, useState } from "react";
import { FaBuilding, FaUsers } from "react-icons/fa";
import { companyRepository } from "../../company/data/companyRepository";
import { MarketingContentPage } from "./MarketingContentPage";
import { homePageContent } from "../data/pageContent/home";
import { MARKETING_HOME_FEATURE_LINKS, MARKETING_PATHS } from "../navigation";
import { SectionBlock } from "../components/SectionBlock";
import type { CompanyMasterReportStats } from "../../resident/data/types";

type HomePageProps = {
  onNavigate: (path: string) => void;
};

export function HomePage({ onNavigate }: HomePageProps) {
  const [stats, setStats] = useState<CompanyMasterReportStats | null>(null);

  useEffect(() => {
    companyRepository.getMasterReportStats().then(setStats);
  }, []);

  const metricCards = useMemo(
    () => [
      { key: "communities", label: "Communities", value: stats?.communities ?? null, icon: FaBuilding },
      { key: "owners", label: "Owners", value: stats?.owners ?? null, icon: FaUsers },
      { key: "activatedUsers", label: "Activated Users", value: stats?.activatedUsers ?? null, icon: FaUsers },
    ],
    [stats]
  );

  return (
    <div className="space-y-8">
      <MarketingContentPage content={homePageContent} onNavigate={onNavigate} />
      <SectionBlock
        title="Live platform metrics"
        subtitle="A quick snapshot of communities currently operating with MVP Condos workflows."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {metricCards.map((metric) => (
            <article key={metric.key} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-2 flex items-center gap-2 text-[#2f64c8]">
                <metric.icon />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {metric.value === null ? "..." : metric.value.toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </SectionBlock>
      <SectionBlock title="Explore">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MARKETING_HOME_FEATURE_LINKS.map((item) => (
            <button
              key={item.page}
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => onNavigate(MARKETING_PATHS[item.page])}
            >
              {item.label}
            </button>
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}

