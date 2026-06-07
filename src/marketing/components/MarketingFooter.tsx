import { MvpLogo } from "../../shared/MvpLogo";
import {
  REQUEST_PROPOSAL_URL,
  SITE_CONTACT,
  SITE_FOOTER_LINKS,
  SITE_HIGHLIGHT_METRICS,
  SITE_LEGAL_LINKS,
  SITE_SOCIAL,
} from "../data/siteContent";
import { homePageContent } from "../data/pageContent/home";
import { pe } from "../typography";

type MarketingFooterProps = {
  onNavigate: (path: string) => void;
};

const isExternal = (href: string) => href.startsWith("http");

export function MarketingFooter({ onNavigate }: MarketingFooterProps) {
  return (
    <footer className="px-6 py-16 md:px-12 lg:px-20 border-t border-border bg-background">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-20">
        <div className="md:col-span-5">
          <button type="button" onClick={() => onNavigate("/")} className="inline-block">
            <MvpLogo />
          </button>
          <p className={`${pe.body} text-muted-foreground mt-5 max-w-xs`}>
            {homePageContent.pageIntro}
          </p>
          <p className={`${pe.bodySm} text-muted-foreground mt-4`}>{SITE_CONTACT.email}</p>
          <p className={`${pe.bodySm} text-muted-foreground`}>Call us TOLL FREE: {SITE_CONTACT.tollFree}</p>
          <p className={`${pe.bodySm} text-muted-foreground mt-2`}>{SITE_CONTACT.headquarters}</p>
          <button
            type="button"
            className={`mt-6 ${pe.eyebrowSm} text-foreground border-b border-foreground/20 pb-0.5 hover:border-foreground/60 transition-colors duration-300`}
            onClick={() => onNavigate(REQUEST_PROPOSAL_URL)}
          >
            Book a Free Second Opinion
          </button>
        </div>

        <div className="md:col-span-3 md:col-start-7">
          <p className={`${pe.eyebrow} text-muted-foreground/50 mb-5`}>Navigation</p>
          <div className="flex flex-col gap-3">
            {SITE_FOOTER_LINKS.map((link) => (
              <button
                key={link.href}
                type="button"
                className={`${pe.bodySm} text-foreground/70 hover:text-foreground transition-colors duration-300 text-left`}
                onClick={() => onNavigate(link.href)}
              >
                {link.label}
              </button>
            ))}
            {SITE_LEGAL_LINKS.map((link) =>
              isExternal(link.href) ? (
                <a
                  key={link.href}
                  href={link.href}
                  className={`${pe.bodySm} text-foreground/70 hover:text-foreground transition-colors duration-300`}
                >
                  {link.label}
                </a>
              ) : (
                <button
                  key={link.href}
                  type="button"
                  className={`${pe.bodySm} text-foreground/70 hover:text-foreground transition-colors duration-300 text-left`}
                  onClick={() => onNavigate(link.href)}
                >
                  {link.label}
                </button>
              )
            )}
          </div>
        </div>

        <div className="md:col-span-2 md:col-start-11">
          <p className={`${pe.eyebrow} text-muted-foreground/50 mb-5`}>Social</p>
          <div className="flex flex-col gap-3">
            <a
              href={SITE_SOCIAL.facebook}
              target="_blank"
              rel="noreferrer"
              className={`${pe.bodySm} text-foreground/70 hover:text-foreground transition-colors duration-300`}
            >
              Facebook
            </a>
            <a
              href={SITE_SOCIAL.instagram}
              target="_blank"
              rel="noreferrer"
              className={`${pe.bodySm} text-foreground/70 hover:text-foreground transition-colors duration-300`}
            >
              Instagram
            </a>
            <a
              href={SITE_SOCIAL.linkedin}
              target="_blank"
              rel="noreferrer"
              className={`${pe.bodySm} text-foreground/70 hover:text-foreground transition-colors duration-300`}
            >
              LinkedIn
            </a>
          </div>
          <div className="mt-8 space-y-2">
            {SITE_HIGHLIGHT_METRICS.map((item) => (
              <p key={item.label} className={`${pe.bodySm} text-muted-foreground`}>
                <span className="font-medium text-foreground/80">{item.value}</span> {item.label}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-8 border-t border-border gap-4">
        <p className={`${pe.caption} text-muted-foreground/50`}>
          {new Date().getFullYear()} © Copyright mvpcondos.com All Rights Reserved.
        </p>
        <p className={`${pe.caption} text-muted-foreground/50`}>Kitchener, Ontario</p>
      </div>
    </footer>
  );
}
