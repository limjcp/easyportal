import type { MarketingAction } from "../../data/pageContent/types";
import { pe } from "../../typography";
import { ArrowUpRightIcon } from "../icons";

type HeroSectionProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  imageAlt?: string;
  actions?: MarketingAction[];
  onNavigate: (path: string) => void;
};

const isExternal = (href: string) => href.startsWith("http");

export function HeroSection({
  eyebrow,
  title,
  subtitle,
  imageUrl,
  imageAlt,
  actions,
  onNavigate,
}: HeroSectionProps) {
  return (
    <section className="relative h-screen flex flex-col justify-end overflow-hidden">
      <div className="absolute inset-0 z-0">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={imageAlt ?? "MVP Condos"}
            className="w-full h-full object-cover transition-transform duration-[2s] ease-out scale-100"
          />
        )}
        <div className="absolute inset-0 bg-foreground/50" />
      </div>

      <div className="relative z-10 px-6 pb-16 md:px-12 lg:px-20 md:pb-20">
        <div className="max-w-5xl">
          {eyebrow && (
            <div className="overflow-hidden mb-6">
              <p className={`${pe.eyebrow} text-background/50`}>{eyebrow}</p>
            </div>
          )}
          <div>
            <h1 className={`${pe.heroTitle} text-background`}>{title}</h1>
            <p className={`mt-6 max-w-2xl ${pe.body} text-background/70`}>{subtitle}</p>
          </div>
          {actions && actions.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-6">
              {actions.map((action) =>
                isExternal(action.href) ? (
                  <a
                    key={action.label}
                    href={action.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`group inline-flex items-center gap-3 ${pe.linkAction} text-background/80 hover:text-background transition-colors duration-500`}
                  >
                    <span className="border-b border-background/30 pb-0.5 group-hover:border-background/60 transition-colors duration-500">
                      {action.label}
                    </span>
                    <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
                  </a>
                ) : (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => onNavigate(action.href)}
                    className={`group inline-flex items-center gap-3 ${pe.linkAction} text-background/80 hover:text-background transition-colors duration-500`}
                  >
                    <span className="border-b border-background/30 pb-0.5 group-hover:border-background/60 transition-colors duration-500">
                      {action.label}
                    </span>
                    <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
                  </button>
                )
              )}
            </div>
          )}
        </div>

        <div className="mt-16 md:mt-20 flex items-center gap-6">
          <div className="w-12 h-px bg-background/30" />
          <span className={`${pe.eyebrowWide} text-background/40`}>Scroll to explore</span>
        </div>
      </div>
    </section>
  );
}
