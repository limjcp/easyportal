import { useCallback, useState } from "react";
import { HOME_CAROUSEL_BACKGROUND, type HomeMainTopic, type HomeTopicLink } from "../../data/homeMainTopics";
import { cn } from "../../../utils/cn";
import { pe } from "../../typography";
import { ArrowUpRightIcon } from "../icons";
import { HomeFadePanel } from "./HomeFadePanel";

type HomeTopicCarouselProps = {
  topics: HomeMainTopic[];
  onNavigate: (path: string) => void;
};

const FADE_MS = 500;

const topicLinkBase =
  "group inline-flex items-center gap-2.5 text-sm md:text-base font-medium tracking-wide transition-colors duration-300 min-h-11 px-6 py-3 md:px-8 md:py-3.5";

function topicLinkClass(link: HomeTopicLink) {
  const variant = link.variant ?? "secondary";

  if (variant === "primary") {
    return cn(topicLinkBase, "bg-background text-foreground hover:bg-background/90");
  }

  return cn(
    topicLinkBase,
    "border-2 border-background/80 text-background hover:border-background hover:bg-background/10"
  );
}

function navButtonClass(disabled: boolean) {
  return cn(
    "inline-flex items-center justify-center text-sm font-medium tracking-wide transition-colors duration-300 min-h-10 px-5 py-2.5",
    "border-2 border-background text-background hover:bg-background/10 disabled:hover:bg-transparent",
    disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
  );
}

export function HomeTopicCarousel({ topics, onNavigate }: HomeTopicCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fadeVisible, setFadeVisible] = useState(true);
  const total = topics.length;
  const topic = topics[activeIndex];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === total - 1;

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (nextIndex === activeIndex || nextIndex < 0 || nextIndex >= total) return;

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        setActiveIndex(nextIndex);
        return;
      }

      setFadeVisible(false);
      window.setTimeout(() => {
        setActiveIndex(nextIndex);
        setFadeVisible(true);
      }, FADE_MS);
    },
    [activeIndex, total]
  );

  const goPrevious = () => goToIndex(activeIndex - 1);
  const goNext = () => goToIndex(activeIndex + 1);

  return (
    <section
      className="relative flex min-h-[calc(100dvh-var(--marketing-header-height))] flex-col justify-center overflow-x-hidden border-b border-border"
      aria-live="polite"
    >
      <div className="absolute inset-x-0 bottom-0 top-[calc(-1*var(--marketing-header-height))] z-0">
        <img
          src={HOME_CAROUSEL_BACKGROUND.imageUrl}
          alt={HOME_CAROUSEL_BACKGROUND.imageAlt}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/55" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-8 text-background sm:py-12 md:px-12 md:py-16 lg:px-20">
        <HomeFadePanel visible={fadeVisible} className="mx-auto w-full max-w-3xl text-center">
          <p className={cn(pe.eyebrow, "mb-4 text-background/50")}>{topic.groupLabel}</p>
          <h1 className={cn(pe.heroTitle, "text-balance text-background")}>{topic.title}</h1>
          <p className={cn("mx-auto mt-6 max-w-2xl", pe.body, "text-background/70")}>
            {topic.description}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 md:gap-5">
            {topic.links.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => onNavigate(link.href)}
                className={topicLinkClass(link)}
              >
                <span>{link.label}</span>
                <ArrowUpRightIcon
                  className={cn(
                    pe.iconMd,
                    "group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                  )}
                />
              </button>
            ))}
          </div>
        </HomeFadePanel>

        <div className="mx-auto mt-8 flex w-full max-w-3xl items-center justify-center gap-4 sm:mt-14 sm:gap-8">
          <button
            type="button"
            onClick={goPrevious}
            disabled={isFirst}
            aria-label="Previous topic"
            className={navButtonClass(isFirst)}
          >
            Previous
          </button>
          <p className={cn(pe.eyebrowSm, "tabular-nums text-background/70")}>
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
          <button
            type="button"
            onClick={goNext}
            disabled={isLast}
            aria-label="Next topic"
            className={navButtonClass(isLast)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
