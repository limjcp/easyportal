import type { MarketingAction } from "../../data/pageContent/types";
import { pe } from "../../typography";
import { ArrowUpRightIcon } from "../icons";

type CtaBandSectionProps = {
  title: string;
  text: string;
  action: MarketingAction;
  onNavigate: (path: string) => void;
};

const isExternal = (href: string) => href.startsWith("http");

export function CtaBandSection({ title, text, action, onNavigate }: CtaBandSectionProps) {
  return (
    <section className="px-6 py-28 md:px-12 lg:px-20 md:py-36 bg-foreground text-background">
      <div className="max-w-3xl">
        <p className={`${pe.eyebrow} text-background/40 mb-8`}>Next Step</p>
        <h2 className={`${pe.sectionTitleLg} text-balance`}>{title}</h2>
        <p className={`mt-6 ${pe.body} text-background/55 max-w-lg`}>{text}</p>
        <div className="mt-10">
          {isExternal(action.href) ? (
            <a
              href={action.href}
              target="_blank"
              rel="noreferrer"
              className={`group inline-flex items-center gap-3 ${pe.link} text-background/60 hover:text-background transition-colors duration-500`}
            >
              <span className="border-b border-background/20 pb-0.5 group-hover:border-background/60 transition-colors duration-500">
                {action.label}
              </span>
              <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(action.href)}
              className={`group inline-flex items-center gap-3 ${pe.link} text-background/60 hover:text-background transition-colors duration-500`}
            >
              <span className="border-b border-background/20 pb-0.5 group-hover:border-background/60 transition-colors duration-500">
                {action.label}
              </span>
              <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
