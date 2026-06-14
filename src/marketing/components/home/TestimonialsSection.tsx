import { FaStar } from "react-icons/fa";
import type { MarketingTestimonial } from "../../data/pageContent/types";
import { EDITORIAL_CONTAINER, EDITORIAL_SECTION_PY } from "../../editorialLayout";
import { EditorialRichText } from "../EditorialRichText";
import { ScrollReveal } from "../ScrollReveal";
import { EditorialSectionHeader } from "./EditorialSectionHeader";
import { pe } from "../../typography";

type TestimonialsSectionProps = {
  title: string;
  subtitle?: string;
  items: MarketingTestimonial[];
  editorial?: boolean;
};

export function TestimonialsSection({
  title,
  subtitle,
  items,
  editorial = false,
}: TestimonialsSectionProps) {
  return (
    <section
      id="testimonials"
      className={editorial ? `${EDITORIAL_SECTION_PY} border-b border-border` : "px-6 py-28 md:px-12 lg:px-20 md:py-36"}
    >
      <div className={editorial ? EDITORIAL_CONTAINER : undefined}>
        <ScrollReveal>
          <EditorialSectionHeader
            variant={editorial ? "editorial" : "default"}
            eyebrow={subtitle ?? "Testimonials"}
            title={title}
            count={`(${String(items.length).padStart(2, "0")}) Reviews`}
          />
        </ScrollReveal>

        <div className="divide-y divide-border">
          {items.map((item, index) => (
            <ScrollReveal
              key={`${item.author}-${item.role}`}
              delay={editorial ? index * 70 : 0}
              className="flex items-start md:items-center justify-between py-7 md:py-8 gap-6"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-10 flex-1">
                <span className={`${pe.eyebrowSm} text-muted-foreground/50 shrink-0 w-24 tabular-nums`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className={editorial ? "text-center md:text-left mx-auto md:mx-0" : undefined}>
                  <div className="mb-2 flex text-[#f59e0b] justify-center md:justify-start">
                    {Array.from({ length: item.rating ?? 5 }).map((_, starIndex) => (
                      <FaStar key={`${item.author}-${starIndex}`} className="text-sm" />
                    ))}
                  </div>
                  <p className={editorial ? `${pe.editorialListTitle} text-foreground` : `${pe.listTitle} text-foreground`}>
                    &ldquo;<EditorialRichText text={item.quote} />&rdquo;
                  </p>
                  <p className={`mt-3 ${pe.eyebrowSm} text-muted-foreground`}>
                    {item.author} — {item.role}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
