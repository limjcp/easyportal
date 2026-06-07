import { pe } from "../../typography";

type StudioSectionProps = {
  pageTitle: string;
  pageIntro?: string;
  liveMetrics: { label: string; value: string | null }[];
  highlightMetrics: { label: string; value: string }[];
};

export function StudioSection({ pageTitle, pageIntro, liveMetrics, highlightMetrics }: StudioSectionProps) {
  const allStats = [
    ...liveMetrics.map((m) => ({
      value: m.value === null ? "..." : m.value,
      label: m.label,
    })),
    ...highlightMetrics.map((m) => ({ value: m.value, label: m.label })),
  ];

  return (
    <section id="studio" className="px-6 py-28 md:px-12 lg:px-20 md:py-36 bg-foreground text-background">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28">
        <div>
          <p className={`${pe.eyebrow} text-background/40 mb-8`}>About MVP Condos</p>
          <h2 className={`${pe.sectionTitleLg} text-balance`}>{pageTitle}</h2>
        </div>
        <div className="flex flex-col justify-end gap-10">
          {pageIntro && (
            <div className="flex flex-col gap-6 max-w-lg">
              <p className={`${pe.body} text-background/55`}>{pageIntro}</p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-10 border-t border-background/10">
            {allStats.map((stat) => (
              <div key={stat.label}>
                <p className={`${pe.stat} text-background`}>{stat.value}</p>
                <p className={`${pe.eyebrowSm} text-background/35 mt-2`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
