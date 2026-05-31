import { MarketingContentPage } from "./MarketingContentPage";
import { contactUsPageContent } from "../data/pageContent/contactUs";
import { SectionBlock } from "../components/SectionBlock";
import { SITE_CONTACT } from "../data/siteContent";

type ContactUsPageProps = {
  onNavigate: (path: string) => void;
};

export function ContactUsPage({ onNavigate }: ContactUsPageProps) {
  return (
    <div className="space-y-8">
      <MarketingContentPage content={contactUsPageContent} onNavigate={onNavigate} />
      <SectionBlock title="Regional Contact Lines" subtitle="Call the office most convenient for your board.">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Toll Free</p>
            <p className="text-base font-semibold text-slate-900">{SITE_CONTACT.tollFree}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">GTA</p>
            <p className="text-base font-semibold text-slate-900">{SITE_CONTACT.gta}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Southwestern Ontario</p>
            <p className="text-base font-semibold text-slate-900">{SITE_CONTACT.southwestern}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Barrie</p>
            <p className="text-base font-semibold text-slate-900">{SITE_CONTACT.barrie}</p>
          </article>
        </div>
        <p className="pt-2 text-sm text-slate-600">Email: {SITE_CONTACT.email}</p>
      </SectionBlock>
    </div>
  );
}

