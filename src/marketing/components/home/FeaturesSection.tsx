import type { MarketingFeatureCard } from "../../data/pageContent/types";
import { pe } from "../../typography";
import { ArrowUpRightIcon } from "../icons";
import { EditorialSectionHeader } from "./EditorialSectionHeader";

type FeatureWithImage = MarketingFeatureCard & {
  imageUrl: string;
  imageAlt: string;
};

type FeaturesSectionProps = {
  title: string;
  subtitle?: string;
  items: FeatureWithImage[];
};

export function FeaturesSection({ title, subtitle, items }: FeaturesSectionProps) {
  return (
    <section id="services" className="px-6 py-28 md:px-12 lg:px-20 md:py-36">
      <EditorialSectionHeader
        eyebrow={subtitle ?? "Services"}
        title={title}
        count={`(${String(items.length).padStart(2, "0")}) Services`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
        {items.map((item, index) => (
          <div key={item.title} className="bg-background group cursor-default">
            <div className="overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.imageAlt}
                className="w-full aspect-[4/3] object-cover transition-all duration-[800ms] ease-out group-hover:scale-105"
              />
            </div>
            <div className="p-6 md:p-8 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <span className={`${pe.eyebrowSm} text-muted-foreground/50 mt-1.5 tabular-nums`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className={`${pe.cardTitle} text-foreground mb-1.5`}>{item.title}</h3>
                  <p className={`${pe.bodySm} text-muted-foreground max-w-sm`}>{item.description}</p>
                </div>
              </div>
              <ArrowUpRightIcon className={`${pe.iconSm} text-muted-foreground/40 transition-all duration-300 mt-1.5 shrink-0`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
