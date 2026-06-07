import { FaStar } from "react-icons/fa";
import type { MarketingTestimonial } from "../../data/pageContent/types";
import { pe } from "../../typography";
import { EditorialSectionHeader } from "./EditorialSectionHeader";

type TestimonialsSectionProps = {
  title: string;
  subtitle?: string;
  items: MarketingTestimonial[];
};

export function TestimonialsSection({ title, subtitle, items }: TestimonialsSectionProps) {
  return (
    <section id="testimonials" className="px-6 py-28 md:px-12 lg:px-20 md:py-36">
      <EditorialSectionHeader
        eyebrow={subtitle ?? "Testimonials"}
        title={title}
        count={`(${String(items.length).padStart(2, "0")}) Reviews`}
      />

      <div className="divide-y divide-border">
        {items.map((item, index) => (
          <div
            key={`${item.author}-${item.role}`}
            className="flex items-start md:items-center justify-between py-7 md:py-8 gap-6"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-10 flex-1">
              <span className={`${pe.eyebrowSm} text-muted-foreground/50 shrink-0 w-24 tabular-nums`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="mb-2 flex text-[#f59e0b]">
                  {Array.from({ length: item.rating ?? 5 }).map((_, starIndex) => (
                    <FaStar key={`${item.author}-${starIndex}`} className="text-sm" />
                  ))}
                </div>
                <p className={`${pe.listTitle} text-foreground`}>&ldquo;{item.quote}&rdquo;</p>
                <p className={`mt-3 ${pe.eyebrowSm} text-muted-foreground`}>
                  {item.author} — {item.role}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
