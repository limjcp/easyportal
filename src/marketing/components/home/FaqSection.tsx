import type { MarketingFaqItem } from "../../data/pageContent/types";
import { pe } from "../../typography";
import { EditorialSectionHeader } from "./EditorialSectionHeader";

type FaqSectionProps = {
  title: string;
  subtitle?: string;
  items: MarketingFaqItem[];
};

export function FaqSection({ title, subtitle, items }: FaqSectionProps) {
  return (
    <section className="px-6 py-28 md:px-12 lg:px-20 md:py-36">
      <EditorialSectionHeader
        eyebrow={subtitle ?? "Questions"}
        title={title}
        count={`(${String(items.length).padStart(2, "0")}) Questions`}
      />

      <div className="divide-y divide-border">
        {items.map((item, index) => (
          <details key={item.question} className="group py-7 md:py-8">
            <summary className="flex items-start md:items-center justify-between gap-6 cursor-pointer list-none">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-10 flex-1">
                <span className={`${pe.eyebrowSm} text-muted-foreground/50 shrink-0 w-24 tabular-nums`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className={`${pe.listTitle} text-foreground group-open:text-muted-foreground transition-colors duration-300`}>
                  {item.question}
                </h3>
              </div>
              <span className={`${pe.eyebrowSm} text-muted-foreground/40 shrink-0 group-open:rotate-45 transition-transform duration-300`}>
                +
              </span>
            </summary>
            <p className={`mt-4 md:ml-[7.5rem] ${pe.bodySm} text-muted-foreground max-w-2xl`}>
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
