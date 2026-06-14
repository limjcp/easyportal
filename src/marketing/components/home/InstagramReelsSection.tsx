import { useEffect, useState } from "react";
import { fetchInstagramReels } from "../../data/instagramService";
import type { InstagramReel } from "../../data/instagramReels";
import { SITE_SOCIAL } from "../../data/siteContent";
import { EDITORIAL_CONTAINER_WIDE, EDITORIAL_SECTION_PY } from "../../editorialLayout";
import { ScrollReveal } from "../ScrollReveal";
import { pe } from "../../typography";
import { ArrowUpRightIcon } from "../icons";
import { EditorialSectionHeader } from "./EditorialSectionHeader";
import { InstagramReelRow } from "./InstagramReelRow";

export function InstagramReelsSection() {
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchInstagramReels()
      .then((items) => {
        if (!cancelled) setReels(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="reels" className={`${EDITORIAL_SECTION_PY} border-t border-border`}>
      <div className={EDITORIAL_CONTAINER_WIDE}>
        <ScrollReveal>
          <EditorialSectionHeader
            variant="editorial"
            eyebrow="From @mvpcondos on Instagram"
            title="Watch The Common Element"
            count={loading ? undefined : `(${String(reels.length).padStart(2, "0")}) Reels`}
          />
        </ScrollReveal>

        <ScrollReveal className="mb-12 text-center">
          <a
            href={SITE_SOCIAL.instagram}
            target="_blank"
            rel="noreferrer"
            className={`group inline-flex items-center gap-3 ${pe.linkAction} text-foreground hover:text-muted-foreground transition-colors duration-500`}
          >
            <span className="border-b border-foreground/20 pb-0.5 group-hover:border-foreground/60 transition-colors duration-500">
              Follow @mvpcondos
            </span>
            <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
          </a>
        </ScrollReveal>

        {loading ? (
          <p className={`${pe.editorialBodySm} text-muted-foreground text-center`}>Loading reels…</p>
        ) : (
          <div className="mx-auto w-full max-w-6xl flex flex-col gap-y-20 md:gap-y-28">
            {reels.map((reel, index) => (
              <ScrollReveal key={reel.shortcode} delay={index * 80}>
                <InstagramReelRow reel={reel} index={index} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
