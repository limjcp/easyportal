import { MarketingContentPage } from "./MarketingContentPage";
import { privacyPolicyPageContent } from "../data/pageContent/privacyPolicy";
import { SectionBlock } from "../components/SectionBlock";
import { SITE_CONTACT } from "../data/siteContent";

type PrivacyPolicyPageProps = {
  onNavigate: (path: string) => void;
};

export function PrivacyPolicyPage({ onNavigate }: PrivacyPolicyPageProps) {
  return (
    <div className="space-y-8">
      <MarketingContentPage content={privacyPolicyPageContent} onNavigate={onNavigate} />
      <SectionBlock title="Privacy Contact">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">For privacy questions and requests:</p>
          <p className="text-base font-semibold text-slate-900">{SITE_CONTACT.email}</p>
        </div>
      </SectionBlock>
    </div>
  );
}

