import { PrivacyPolicyBody } from "../components/home/PrivacyPolicyBody";
import { PageHeaderSection } from "../components/home/PageHeaderSection";
import { privacyPolicyMeta, privacyPolicySections } from "../data/pageContent/privacyPolicyContent";
import { EDITORIAL_CONTAINER, EDITORIAL_PROSE, EDITORIAL_SECTION_PY } from "../editorialLayout";
import { EditorialRichText } from "../components/EditorialRichText";
import { ScrollReveal } from "../components/ScrollReveal";
import { pe } from "../typography";

type PrivacyPolicyPageProps = {
  onNavigate: (path: string) => void;
};

export function PrivacyPolicyPage({ onNavigate }: PrivacyPolicyPageProps) {
  return (
    <>
      <PageHeaderSection
        eyebrow={`Last updated: ${privacyPolicyMeta.lastUpdated}`}
        title={privacyPolicyMeta.title}
      />
      <section className={`${EDITORIAL_SECTION_PY} border-b border-border`}>
        <ScrollReveal className={`${EDITORIAL_CONTAINER} text-center`}>
          <div className={`${EDITORIAL_PROSE} space-y-6`}>
            {privacyPolicyMeta.intro.map((paragraph) => (
              <p key={paragraph} className={`${pe.editorialBodySm} text-muted-foreground text-center md:text-left`}>
                <EditorialRichText text={paragraph} />
              </p>
            ))}
          </div>
        </ScrollReveal>
      </section>
      <PrivacyPolicyBody sections={privacyPolicySections} onNavigate={onNavigate} />
    </>
  );
}
