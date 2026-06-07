import type { MarketingFeatureCard } from "../../data/pageContent/types";
import { EditorialSectionHeader } from "./EditorialSectionHeader";
import { pe } from "../../typography";

type ApproachGridSectionProps = {
  title: string;
  subtitle?: string;
  items: MarketingFeatureCard[];
  countLabel?: string;
};

export function ApproachGridSection({ title, subtitle, items, countLabel = "Items" }: ApproachGridSectionProps) {
  return (
    <section className="px-6 py-28 md:px-12 lg:px-20 md:py-36">
      <EditorialSectionHeader
        eyebrow={subtitle ?? countLabel}
        title={title}
        count={`(${String(items.length).padStart(2, "0")}) ${countLabel}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
        {items.map((item, index) => (
          <div key={item.title} className="bg-background p-8 md:p-12 group">
            <div className="flex items-start justify-between mb-10">
              <span className={`${pe.eyebrowSm} text-muted-foreground/40`}>
                ({String(index + 1).padStart(2, "0")})
              </span>
            </div>
            <h3 className={`${pe.cardTitleLg} text-foreground mb-5 group-hover:translate-x-1 transition-transform duration-500`}>
              {item.title}
            </h3>
            <div className="w-8 h-px bg-border mb-5 group-hover:w-12 transition-all duration-500" />
            <p className={`${pe.bodySm} text-muted-foreground max-w-sm`}>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
