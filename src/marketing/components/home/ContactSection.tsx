import type { MarketingAction } from "../../data/pageContent/types";
import { SITE_CONTACT } from "../../data/siteContent";
import { pe } from "../../typography";
import { ArrowUpRightIcon } from "../icons";

type ContactSectionProps = {
  title: string;
  text: string;
  action: MarketingAction;
  onNavigate: (path: string) => void;
};

const isExternal = (href: string) => href.startsWith("http");

export function ContactSection({ title, text, action, onNavigate }: ContactSectionProps) {
  return (
    <section id="contact" className="px-6 py-28 md:px-12 lg:px-20 md:py-36 bg-foreground text-background">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28">
        <div>
          <p className={`${pe.eyebrow} text-background/40 mb-8`}>Get in Touch</p>
          <h2 className={`${pe.sectionTitleLg} text-balance`}>{title}</h2>
          <p className={`mt-6 ${pe.body} text-background/55 max-w-lg`}>{text}</p>
          <div className="mt-10 flex flex-col gap-4">
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
            <a
              href={`mailto:${SITE_CONTACT.email}`}
              className={`group inline-flex items-center gap-3 ${pe.link} text-background/60 hover:text-background transition-colors duration-500`}
            >
              <span className="border-b border-background/20 pb-0.5 group-hover:border-background/60 transition-colors duration-500">
                {SITE_CONTACT.email}
              </span>
              <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
            </a>
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className={`${pe.eyebrow} text-background/35 mb-5`}>Headquarters</p>
              <p className={`${pe.bodySm} text-background/55`}>{SITE_CONTACT.headquarters}</p>
              <p className={`${pe.bodySm} text-background/55 mt-4`}>Toll Free: {SITE_CONTACT.tollFree}</p>
            </div>
            <div>
              <p className={`${pe.eyebrow} text-background/35 mb-5`}>Regional</p>
              <p className={`${pe.bodySm} text-background/55`}>GTA: {SITE_CONTACT.gta}</p>
              <p className={`${pe.bodySm} text-background/55 mt-2`}>Southwestern Ontario: {SITE_CONTACT.southwestern}</p>
              <p className={`${pe.bodySm} text-background/55 mt-2`}>Barrie: {SITE_CONTACT.barrie}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
