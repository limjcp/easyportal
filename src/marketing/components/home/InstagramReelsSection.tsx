import { useEffect, useState } from "react";
import { fetchInstagramReels } from "../../data/instagramService";
import type { InstagramReel } from "../../data/instagramReels";
import { SITE_SOCIAL } from "../../data/siteContent";
import { pe } from "../../typography";
import { ArrowUpRightIcon } from "../icons";
import { EditorialSectionHeader } from "./EditorialSectionHeader";
import { InstagramReelEmbed } from "./InstagramReelEmbed";

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
    <section id="reels" className="px-6 py-28 md:px-12 lg:px-20 md:py-36 border-t border-border">
      <EditorialSectionHeader
        eyebrow="From @mvpcondos on Instagram"
        title="Watch The Common Element"
        count={loading ? undefined : `(${String(reels.length).padStart(2, "0")}) Reels`}
      />

      <div className="mb-12">
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
      </div>

      {loading ? (
        <p className={`${pe.bodySm} text-muted-foreground`}>Loading reels…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-px bg-border">
          {reels.map((reel, index) => (
            <InstagramReelEmbed key={reel.shortcode} reel={reel} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
