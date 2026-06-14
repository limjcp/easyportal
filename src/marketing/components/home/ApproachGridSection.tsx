import type { MarketingFeatureCard } from "../../data/pageContent/types";
import { EDITORIAL_CONTAINER_WIDE, EDITORIAL_SECTION_PY } from "../../editorialLayout";
import { EditorialRichText } from "../EditorialRichText";
import { ScrollReveal } from "../ScrollReveal";
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
    <section className={`${EDITORIAL_SECTION_PY} border-b border-border`}>
      <div className={EDITORIAL_CONTAINER_WIDE}>
        <ScrollReveal>
          <EditorialSectionHeader
            variant="editorial"
            eyebrow={subtitle ?? countLabel}
            title={title}
            count={`(${String(items.length).padStart(2, "0")}) ${countLabel}`}
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          {items.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 80} className="bg-background p-8 md:p-10 lg:p-12 group">
              <div className="flex items-start justify-between mb-8">
                <span className={`${pe.eyebrowSm} text-muted-foreground/40`}>
                  ({String(index + 1).padStart(2, "0")})
                </span>
              </div>
              <h3 className={`${pe.editorialCardTitle} text-foreground mb-5 group-hover:translate-x-1 transition-transform duration-500`}>
                {item.title}
              </h3>
              <div className="w-10 h-px bg-border mb-5 group-hover:w-16 transition-all duration-500" />
              <p className={`${pe.editorialBodySm} text-muted-foreground max-w-xl mx-auto md:mx-0 text-center md:text-left`}>
                <EditorialRichText text={item.description} />
              </p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
