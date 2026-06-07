import { useState } from "react";
import { MVP_HISTORY_TIMELINE } from "../../data/mvpHistoryTimeline";
import { pe } from "../../typography";
import { EditorialSectionHeader } from "./EditorialSectionHeader";

export function HistoryTimelineSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const entry = MVP_HISTORY_TIMELINE[activeIndex];
  const total = MVP_HISTORY_TIMELINE.length;
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === total - 1;

  const goPrevious = () => setActiveIndex((i) => Math.max(i - 1, 0));
  const goNext = () => setActiveIndex((i) => Math.min(i + 1, total - 1));

  return (
    <section className="px-6 py-28 md:px-12 lg:px-20 md:py-36 border-t border-border">
      <EditorialSectionHeader
        eyebrow="Our History"
        title="MVP Condos through the years"
        count={`(${String(total).padStart(2, "0")}) Milestones`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        <div className="lg:col-span-7 overflow-hidden">
          <img
            key={entry.id}
            src={entry.imageUrl}
            alt={entry.imageAlt}
            className="w-full aspect-[16/10] object-cover grayscale hover:grayscale-0 transition-all duration-1000"
          />
        </div>

        <div className="lg:col-span-5" aria-live="polite">
          <div className="flex items-end justify-between gap-4 mb-8 pb-6 border-b border-border">
            <div>
              <p className={`${pe.eyebrow} text-muted-foreground mb-2`}>{entry.dateLabel}</p>
              <p className={`${pe.stat} text-foreground tabular-nums`}>{entry.year}</p>
            </div>
            <p className={`${pe.eyebrowSm} text-muted-foreground/50 tabular-nums`}>
              {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </p>
          </div>

          <h3 className={`${pe.cardTitleLg} text-foreground mb-4`}>{entry.title}</h3>
          <p className={`${pe.body} text-muted-foreground`}>{entry.description}</p>

          <div className="mt-10 flex items-center gap-6">
            <button
              type="button"
              onClick={goPrevious}
              disabled={isFirst}
              aria-label="Previous milestone"
              className={`${pe.eyebrowSm} text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors duration-300`}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={isLast}
              aria-label="Next milestone"
              className={`${pe.eyebrowSm} text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors duration-300`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
