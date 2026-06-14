import type { MarketingAction } from "../../data/pageContent/types";
import { EDITORIAL_CONTAINER, EDITORIAL_PROSE, EDITORIAL_SECTION_PY } from "../../editorialLayout";
import { EditorialRichText } from "../EditorialRichText";
import { ScrollReveal } from "../ScrollReveal";
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
    <section className={`${EDITORIAL_SECTION_PY} bg-foreground text-background`}>
      <ScrollReveal className={`${EDITORIAL_CONTAINER} text-center`}>
        <p className={`${pe.eyebrow} text-background/40 mb-6`}>Next Step</p>
        <h2 className={`${pe.editorialSectionTitle} text-balance mx-auto max-w-4xl`}>{title}</h2>
        <p className={`mt-8 ${EDITORIAL_PROSE} ${pe.editorialBody} text-background/60`}>
          <EditorialRichText text={text} />
        </p>
        <div className="mt-10">
          {isExternal(action.href) ? (
            <a
              href={action.href}
              target="_blank"
              rel="noreferrer"
              className={`group inline-flex items-center gap-3 ${pe.link} text-background/70 hover:text-background transition-colors duration-500`}
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
              className={`group inline-flex items-center gap-3 ${pe.link} text-background/70 hover:text-background transition-colors duration-500`}
            >
              <span className="border-b border-background/20 pb-0.5 group-hover:border-background/60 transition-colors duration-500">
                {action.label}
              </span>
              <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
            </button>
          )}
        </div>
      </ScrollReveal>
    </section>
  );
}
