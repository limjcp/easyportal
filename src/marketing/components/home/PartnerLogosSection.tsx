import { cn } from "../../../utils/cn";
import { PARTNER_LOGOS } from "../../data/partnerLogos";
import { pe } from "../../typography";

type PartnerLogosSectionProps = {
  onNavigate?: (path: string) => void;
  compact?: boolean;
};

export function PartnerLogosSection({ onNavigate, compact = false }: PartnerLogosSectionProps) {
  return (
    <section
      className={cn(
        "border-t border-border px-6 md:px-12 lg:px-20",
        compact ? "py-12 md:py-14" : "py-24 md:py-32"
      )}
    >
      <p
        className={cn(
          `${pe.eyebrow} text-muted-foreground text-center`,
          compact ? "mb-8" : "mb-16"
        )}
      >
        Affiliations &amp; Memberships
      </p>

      <div
        className={cn(
          "flex flex-wrap items-center justify-center",
          compact ? "gap-x-10 gap-y-8 md:gap-x-14" : "gap-x-14 gap-y-12 md:gap-x-20 md:gap-y-14 lg:gap-x-24"
        )}
      >
        {PARTNER_LOGOS.map((logo) => {
          const image = (
            <img
              src={logo.src}
              alt={logo.alt}
              className={cn(
                "w-auto object-contain",
                compact
                  ? "h-16 sm:h-20 md:h-24 max-w-[220px] sm:max-w-[260px]"
                  : "h-24 sm:h-28 md:h-32 lg:h-36 max-w-[280px] sm:max-w-[320px] md:max-w-[360px]"
              )}
              loading="lazy"
              decoding="async"
            />
          );

          if (logo.href && onNavigate) {
            return (
              <button
                key={logo.src}
                type="button"
                onClick={() => onNavigate(logo.href!)}
                className="flex items-center justify-center"
                aria-label={logo.alt}
              >
                {image}
              </button>
            );
          }

          if (logo.href) {
            return (
              <a
                key={logo.src}
                href={logo.href}
                className="flex items-center justify-center"
                aria-label={logo.alt}
              >
                {image}
              </a>
            );
          }

          return (
            <div key={logo.src} className="flex items-center justify-center">
              {image}
            </div>
          );
        })}
      </div>
    </section>
  );
}
