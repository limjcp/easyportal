import { PARTNER_LOGOS } from "../../data/partnerLogos";
import { pe } from "../../typography";

type PartnerLogosSectionProps = {
  onNavigate?: (path: string) => void;
};

export function PartnerLogosSection({ onNavigate }: PartnerLogosSectionProps) {
  return (
    <section className="px-6 py-24 md:px-12 lg:px-20 md:py-32 border-t border-border">
      <p className={`${pe.eyebrow} text-muted-foreground mb-16 text-center`}>Affiliations &amp; Memberships</p>

      <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-12 md:gap-x-20 md:gap-y-14 lg:gap-x-24">
        {PARTNER_LOGOS.map((logo) => {
          const image = (
            <img
              src={logo.src}
              alt={logo.alt}
              className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto max-w-[240px] sm:max-w-[280px] md:max-w-[320px] object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
              loading="lazy"
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
