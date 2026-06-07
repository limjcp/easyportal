import { SITE_CONTACT } from "../../data/siteContent";
import type { PrivacyPolicySection, PrivacyPolicySubsection } from "../../data/pageContent/privacyPolicyContent";
import { pe } from "../../typography";
import { ArrowUpRightIcon } from "../icons";

type PrivacyPolicyBodyProps = {
  sections: PrivacyPolicySection[];
  onNavigate: (path: string) => void;
};

function SubsectionBlock({ subsection, nested = false }: { subsection: PrivacyPolicySubsection; nested?: boolean }) {
  const titleClass = nested ? pe.cardTitle : pe.cardTitleLg;

  return (
    <div className={nested ? "mt-10" : "mt-12 first:mt-0"}>
      {subsection.title && (
        <h3 className={`${titleClass} text-foreground mb-5`}>{subsection.title}</h3>
      )}
      {subsection.paragraphs?.map((paragraph) => (
        <p key={paragraph} className={`${pe.bodySm} text-muted-foreground mb-4 last:mb-0`}>
          {paragraph}
        </p>
      ))}
      {subsection.bullets && subsection.bullets.length > 0 && (
        <ul className={`mt-4 list-disc space-y-2 pl-6 ${pe.bodySm} text-muted-foreground`}>
          {subsection.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      )}
      {subsection.definitions && subsection.definitions.length > 0 && (
        <dl className="mt-6 space-y-5">
          {subsection.definitions.map((item) => (
            <div key={item.term} className="border-l border-border pl-6">
              <dt className={`${pe.bodySm} font-medium text-foreground`}>{item.term}</dt>
              <dd className={`mt-1 ${pe.bodySm} text-muted-foreground`}>{item.definition}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function PrivacyPolicyBody({ sections, onNavigate }: PrivacyPolicyBodyProps) {
  return (
    <div className="px-6 py-28 md:px-12 lg:px-20 md:py-36">
      {sections.map((section) => (
        <section key={section.title} className="mb-20 pb-20 border-b border-border last:mb-0 last:pb-0 last:border-b-0">
          <h2 className={`${pe.sectionTitle} text-foreground mb-8`}>{section.title}</h2>

          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className={`${pe.bodySm} text-muted-foreground mb-4`}>
              {paragraph}
            </p>
          ))}

          {section.bullets && (
            <ul className={`mt-4 list-disc space-y-2 pl-6 ${pe.bodySm} text-muted-foreground`}>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
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
        </section>
      ))}

      <section className="mt-20 pt-20 border-t border-border bg-foreground text-background px-8 py-12 md:px-12 md:py-16">
        <p className={`${pe.eyebrow} text-background/40 mb-6`}>Contact Us</p>
        <h2 className={`${pe.sectionTitleLg} text-balance mb-6`}>For privacy questions</h2>
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
      </section>
    </div>
  );
}
