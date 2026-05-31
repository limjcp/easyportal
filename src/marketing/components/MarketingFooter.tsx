import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import {
  REQUEST_PROPOSAL_URL,
  SITE_CONTACT,
  SITE_FOOTER_LINKS,
  SITE_HIGHLIGHT_METRICS,
  SITE_LEGAL_LINKS,
  SITE_SOCIAL,
} from "../data/siteContent";

type MarketingFooterProps = {
  onNavigate: (path: string) => void;
};

const isExternal = (href: string) => href.startsWith("http");

export function MarketingFooter({ onNavigate }: MarketingFooterProps) {
  return (
    <footer className="border-t border-slate-200 bg-[#111827] text-white">
      <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">MVP Condo PM</h3>
          <p className="mt-3 text-sm text-white/90">{SITE_CONTACT.email}</p>
          <p className="text-sm text-white/90">Call us TOLL FREE: {SITE_CONTACT.tollFree}</p>
          <p className="mt-2 text-sm text-white/70">{SITE_CONTACT.headquarters}</p>
          <button
            type="button"
            className="mt-4 rounded-full bg-[#3476ef] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d68cf]"
            onClick={() => onNavigate(REQUEST_PROPOSAL_URL)}
          >
            Book a Free Consultation
          </button>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">Everything Condo</h3>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            {SITE_FOOTER_LINKS.map((link) => (
              <button
                key={link.href}
                type="button"
                className="text-left text-white/90 hover:underline"
                onClick={() => onNavigate(link.href)}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex gap-3 text-white/90">
            <a href={SITE_SOCIAL.facebook} target="_blank" rel="noreferrer" className="hover:text-white">
              <FaFacebookF />
            </a>
            <a href={SITE_SOCIAL.instagram} target="_blank" rel="noreferrer" className="hover:text-white">
              <FaInstagram />
            </a>
            <a href={SITE_SOCIAL.linkedin} target="_blank" rel="noreferrer" className="hover:text-white">
              <FaLinkedinIn />
            </a>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-white/90">
            {SITE_LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                {isExternal(link.href) ? (
                  <a href={link.href} className="hover:underline">
                    {link.label}
                  </a>
                ) : (
                  <button type="button" className="hover:underline" onClick={() => onNavigate(link.href)}>
                    {link.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-white/70">
            {SITE_HIGHLIGHT_METRICS.map((item) => (
              <p key={item.label}>
                <span className="font-semibold text-white/90">{item.value}</span> {item.label}
              </p>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/70">
        {new Date().getFullYear()} © Copyright mvpcondos.com All Rights Reserved.
      </div>
    </footer>
  );
}

