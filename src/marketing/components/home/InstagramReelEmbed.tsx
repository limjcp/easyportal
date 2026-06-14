import type { InstagramReel } from "../../data/instagramReels";
import { cn } from "../../../utils/cn";

type InstagramReelEmbedProps = {
  reel: InstagramReel;
  align?: "start" | "end" | "center";
};

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-10 w-10 text-background"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

const frameClass = (align: InstagramReelEmbedProps["align"]) =>
  cn(
    "w-full max-w-sm aspect-[9/16] overflow-hidden bg-foreground/5",
    align === "end" ? "mx-auto md:ml-auto md:mr-0" : align === "start" ? "mx-auto md:ml-0 md:mr-auto" : "mx-auto"
  );

export function InstagramReelEmbed({ reel, align = "center" }: InstagramReelEmbedProps) {
  const label = reel.caption ?? `Instagram reel by MVP Condos`;

  if (reel.videoUrl) {
    return (
      <div className={frameClass(align)}>
        <video
          src={reel.videoUrl}
          poster={reel.thumbnailUrl}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          aria-label={label}
        />
      </div>
    );
  }

  return (
    <a
      href={reel.permalink}
      target="_blank"
      rel="noreferrer"
      className={cn("group relative block", frameClass(align))}
      aria-label={`${label} — watch on Instagram`}
    >
      {reel.thumbnailUrl ? (
        <img
          src={reel.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <span className="text-sm text-muted-foreground">Video unavailable</span>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 transition-colors duration-300 group-hover:bg-foreground/30">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground/60 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
          <PlayIcon />
        </div>
      </div>
    </a>
  );
}
