import type { InstagramReel } from "../../data/instagramReels";
import { pe } from "../../typography";
import { ArrowUpRightIcon } from "../icons";
import { InstagramReelEmbed } from "./InstagramReelEmbed";
import { cn } from "../../../utils/cn";

type InstagramReelRowProps = {
  reel: InstagramReel;
  index: number;
};

function ReelCaption({ reel, index }: { reel: InstagramReel; index: number }) {
  return (
    <div className="flex flex-col justify-center px-0 md:px-4 lg:px-8">
      <p className={`${pe.eyebrowSm} text-muted-foreground mb-4`}>
        Reel {String(index + 1).padStart(2, "0")}
      </p>
      <p className={`${pe.cardTitleLg} text-foreground text-balance`}>
        {reel.caption ?? "Watch this reel on Instagram"}
      </p>
      <a
        href={reel.permalink}
        target="_blank"
        rel="noreferrer"
        className={`group mt-8 inline-flex items-center gap-3 ${pe.linkAction} text-foreground/70 hover:text-foreground transition-colors duration-500 w-fit`}
      >
        <span className="border-b border-foreground/20 pb-0.5 group-hover:border-foreground/60 transition-colors duration-500">
          View on Instagram
        </span>
        <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
      </a>
    </div>
  );
}

export function InstagramReelRow({ reel, index }: InstagramReelRowProps) {
  const videoLeft = index % 2 === 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
      <div className={cn("order-1", !videoLeft && "md:order-2")}>
        <InstagramReelEmbed reel={reel} align={videoLeft ? "start" : "end"} />
      </div>
      <div className={cn("order-2", !videoLeft && "md:order-1")}>
        <ReelCaption reel={reel} index={index} />
      </div>
    </div>
  );
}
