import type { MarketingAction } from "../../data/pageContent/types";
import { EDITORIAL_CONTAINER, EDITORIAL_PROSE, EDITORIAL_SECTION_PY } from "../../editorialLayout";
import { EditorialRichText } from "../EditorialRichText";
import { ScrollReveal } from "../ScrollReveal";
import { pe } from "../../typography";
import { ArrowUpRightIcon } from "../icons";

type PageHeaderSectionProps = {
  eyebrow?: string;
  title: string;
  intro?: string;
  actions?: MarketingAction[];
  onNavigate?: (path: string) => void;
};

const isExternal = (href: string) => href.startsWith("http");

export function PageHeaderSection({ eyebrow, title, intro, actions, onNavigate }: PageHeaderSectionProps) {
  return (
    <section className={`${EDITORIAL_SECTION_PY} border-b border-border`}>
      <ScrollReveal className={`${EDITORIAL_CONTAINER} text-center`}>
        {eyebrow && <p className={`${pe.eyebrow} text-muted-foreground mb-4`}>{eyebrow}</p>}
        <h1 className={`${pe.editorialPageTitle} text-foreground`}>{title}</h1>
        {intro && (
          <p className={`mt-8 ${EDITORIAL_PROSE} ${pe.editorialLead} text-muted-foreground`}>
            <EditorialRichText text={intro} />
          </p>
        )}
        {actions && actions.length > 0 && onNavigate && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {actions.map((action) =>
              isExternal(action.href) ? (
                <a
                  key={action.label}
                  href={action.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`group inline-flex items-center gap-3 ${pe.linkAction} text-foreground/70 hover:text-foreground transition-colors duration-500`}
                >
                  <span className="border-b border-foreground/20 pb-0.5 group-hover:border-foreground/60 transition-colors duration-500">
                    {action.label}
                  </span>
                  <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
                </a>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => onNavigate(action.href)}
                  className={`group inline-flex items-center gap-3 ${pe.linkAction} text-foreground/70 hover:text-foreground transition-colors duration-500`}
                >
                  <span className="border-b border-foreground/20 pb-0.5 group-hover:border-foreground/60 transition-colors duration-500">
                    {action.label}
                  </span>
                  <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
                </button>
              )
            )}
          </div>
        )}
      </ScrollReveal>
    </section>
  );
}
