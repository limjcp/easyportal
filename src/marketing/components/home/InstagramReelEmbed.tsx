import type { InstagramReel } from "../../data/instagramReels";
import { pe } from "../../typography";

type InstagramReelEmbedProps = {
  reel: InstagramReel;
  index: number;
};

export function InstagramReelEmbed({ reel, index }: InstagramReelEmbedProps) {
  return (
    <article className="bg-background border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4">
        <span className={`${pe.eyebrowSm} text-muted-foreground/50 tabular-nums shrink-0`}>
          {String(index + 1).padStart(2, "0")}
        </span>
        {reel.caption && (
          <p className={`${pe.bodySm} text-muted-foreground line-clamp-2`}>{reel.caption}</p>
        )}
      </div>
      <div className="px-6 py-6 flex justify-center bg-foreground/5">
        <div className="relative w-full max-w-[340px] aspect-[9/16]">
          <iframe
            src={`https://www.instagram.com/reel/${reel.shortcode}/embed`}
            title={reel.caption ?? `Instagram reel ${reel.shortcode}`}
            className="absolute inset-0 h-full w-full border-0"
            scrolling="no"
            allow="encrypted-media; autoplay; clipboard-write"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
      <div className="px-6 py-4 border-t border-border">
        <a
          href={reel.permalink}
          target="_blank"
          rel="noreferrer"
          className={`${pe.eyebrowSm} text-foreground/70 hover:text-foreground transition-colors duration-300`}
        >
          Watch on Instagram
        </a>
      </div>
    </article>
  );
}
