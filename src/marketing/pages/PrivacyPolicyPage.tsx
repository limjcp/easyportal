import { PrivacyPolicyBody } from "../components/home/PrivacyPolicyBody";
import { PageHeaderSection } from "../components/home/PageHeaderSection";
import { privacyPolicyMeta, privacyPolicySections } from "../data/pageContent/privacyPolicyContent";
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
      <section className="px-6 pb-16 md:px-12 lg:px-20 md:pb-20 border-b border-border">
        <div className="max-w-3xl space-y-6">
          {privacyPolicyMeta.intro.map((paragraph) => (
            <p key={paragraph} className={`${pe.body} text-muted-foreground`}>
              {paragraph}
            </p>
          ))}
        </div>
      </section>
      <PrivacyPolicyBody sections={privacyPolicySections} onNavigate={onNavigate} />
    </>
  );
}
