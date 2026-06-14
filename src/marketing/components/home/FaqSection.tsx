import type { MarketingFaqItem } from "../../data/pageContent/types";
import { EDITORIAL_CONTAINER, EDITORIAL_SECTION_PY } from "../../editorialLayout";
import { EditorialRichText } from "../EditorialRichText";
import { ScrollReveal } from "../ScrollReveal";
import { EditorialSectionHeader } from "./EditorialSectionHeader";
import { pe } from "../../typography";

type FaqSectionProps = {
  title: string;
  subtitle?: string;
  items: MarketingFaqItem[];
};

export function FaqSection({ title, subtitle, items }: FaqSectionProps) {
  return (
    <section className={`${EDITORIAL_SECTION_PY} border-b border-border`}>
      <div className={EDITORIAL_CONTAINER}>
        <ScrollReveal>
          <EditorialSectionHeader
            variant="editorial"
            eyebrow={subtitle ?? "Questions"}
            title={title}
            count={`(${String(items.length).padStart(2, "0")}) Questions`}
          />
        </ScrollReveal>

        <div className="divide-y divide-border">
          {items.map((item, index) => (
            <ScrollReveal key={item.question} delay={index * 60} as="article">
              <details className="group py-8 md:py-10">
                <summary className="flex items-start md:items-center justify-between gap-6 cursor-pointer list-none">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-10 flex-1 text-left">
                    <span className={`${pe.eyebrowSm} text-muted-foreground/50 shrink-0 w-24 tabular-nums`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className={`${pe.editorialListTitle} text-foreground group-open:text-muted-foreground transition-colors duration-300`}>
                      <EditorialRichText text={item.question} />
                    </h3>
                  </div>
                  <span className={`${pe.eyebrowSm} text-muted-foreground/40 shrink-0 group-open:rotate-45 transition-transform duration-300`}>
                    +
                  </span>
                </summary>
                <p className={`mt-5 md:ml-[7.5rem] ${pe.editorialBodySm} text-muted-foreground max-w-4xl text-left`}>
                  <EditorialRichText text={item.answer} />
                </p>
              </details>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
