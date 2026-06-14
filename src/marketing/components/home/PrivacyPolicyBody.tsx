import { SITE_CONTACT } from "../../data/siteContent";
import type { PrivacyPolicySection, PrivacyPolicySubsection } from "../../data/pageContent/privacyPolicyContent";
import { EDITORIAL_CONTAINER, EDITORIAL_SECTION_PY } from "../../editorialLayout";
import { EditorialRichText } from "../EditorialRichText";
import { ScrollReveal } from "../ScrollReveal";
import { pe } from "../../typography";
import { ArrowUpRightIcon } from "../icons";

type PrivacyPolicyBodyProps = {
  sections: PrivacyPolicySection[];
  onNavigate: (path: string) => void;
};

function SubsectionBlock({ subsection, nested = false }: { subsection: PrivacyPolicySubsection; nested?: boolean }) {
  const titleClass = nested ? pe.editorialCardTitle : pe.editorialSectionTitle;

  return (
    <div className={nested ? "mt-10" : "mt-12 first:mt-0"}>
      {subsection.title && (
        <h3 className={`${titleClass} text-foreground mb-5 text-center md:text-left`}>{subsection.title}</h3>
      )}
      {subsection.paragraphs?.map((paragraph) => (
        <p key={paragraph} className={`${pe.editorialBodySm} text-muted-foreground mb-4 last:mb-0 text-center md:text-left`}>
          <EditorialRichText text={paragraph} />
        </p>
      ))}
      {subsection.bullets && subsection.bullets.length > 0 && (
        <ul className={`mt-4 list-disc space-y-2 pl-6 ${pe.editorialBodySm} text-muted-foreground text-left`}>
          {subsection.bullets.map((bullet) => (
            <li key={bullet}>
              <EditorialRichText text={bullet} />
            </li>
          ))}
        </ul>
      )}
      {subsection.definitions && subsection.definitions.length > 0 && (
        <dl className="mt-6 space-y-5">
          {subsection.definitions.map((item) => (
            <div key={item.term} className="border-l border-border pl-6 text-left">
              <dt className={`${pe.editorialBodySm} font-medium text-foreground`}>{item.term}</dt>
              <dd className={`mt-1 ${pe.editorialBodySm} text-muted-foreground`}>
                <EditorialRichText text={item.definition} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function PrivacyPolicyBody({ sections, onNavigate }: PrivacyPolicyBodyProps) {
  return (
    <div className={EDITORIAL_SECTION_PY}>
      <div className={EDITORIAL_CONTAINER}>
        {sections.map((section, sectionIndex) => (
          <ScrollReveal
            key={section.title}
            delay={sectionIndex * 50}
            as="section"
            className="mb-20 pb-20 border-b border-border last:mb-0 last:pb-0 last:border-b-0"
          >
            <h2 className={`${pe.editorialSectionTitle} text-foreground mb-8 text-center`}>{section.title}</h2>

            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className={`${pe.editorialBodySm} text-muted-foreground mb-4 text-center md:text-left`}>
                <EditorialRichText text={paragraph} />
              </p>
            ))}

            {section.bullets && (
              <ul className={`mt-4 list-disc space-y-2 pl-6 ${pe.editorialBodySm} text-muted-foreground text-left`}>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>
                    <EditorialRichText text={bullet} />
                  </li>
                ))}
              </ul>
            )}

            {section.subsections?.map((subsection, index) => (
              <SubsectionBlock
                key={`${section.title}-${subsection.title ?? index}`}
                subsection={subsection}
                nested
              />
            ))}
          </ScrollReveal>
        ))}

        <ScrollReveal className="mt-20 pt-20 border-t border-border bg-foreground text-background px-8 py-12 md:px-12 md:py-16 text-center">
          <p className={`${pe.eyebrow} text-background/40 mb-6`}>Contact Us</p>
          <h2 className={`${pe.editorialSectionTitle} text-balance mb-6 mx-auto max-w-4xl`}>For privacy questions</h2>
          <a
            href={`mailto:${SITE_CONTACT.email}`}
            className={`group inline-flex items-center gap-3 ${pe.link} text-background/70 hover:text-background transition-colors duration-500`}
          >
            <span className="border-b border-background/20 pb-0.5 group-hover:border-background/60 transition-colors duration-500">
              {SITE_CONTACT.email}
            </span>
            <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
          </a>
          <div className="mt-10">
            <button
              type="button"
              onClick={() => onNavigate("/contact-us")}
              className={`group inline-flex items-center gap-3 ${pe.linkAction} text-background/70 hover:text-background transition-colors duration-500`}
            >
              <span className="border-b border-background/20 pb-0.5 group-hover:border-background/60 transition-colors duration-500">
                Contact MVP
              </span>
              <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
            </button>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
