import { useEffect, useState, type ReactNode } from "react";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import { getPortalConfig, getPublicBackgroundImages } from "../resident/data/portalConfig";
import type { PublicPortalDocument, PublicPortalSettings } from "../resident/data/types";
import { MvpLogo } from "../shared/MvpLogo";
import { MARKETING_HEADER_LINKS, MARKETING_PATHS } from "../marketing/navigation";

type LoginLayoutProps = {
  children: ReactNode;
  onOpenMarketing?: (path?: string) => void;
};

export function LoginLayout({ children, onOpenMarketing }: LoginLayoutProps) {
  const [settings, setSettings] = useState<PublicPortalSettings | null>(null);
  const [publicDocs, setPublicDocs] = useState<PublicPortalDocument[]>([]);
  const [bgUrl, setBgUrl] = useState<string | undefined>();

  useEffect(() => {
    const config = getPortalConfig();
    setSettings(config.publicPortalSettings);
    setPublicDocs(config.publicPortalDocuments);
    setBgUrl(getPublicBackgroundImages()[0]?.url);
  }, []);

  const themeColor = settings?.portalThemeColor ?? "#3476ef";

  return (
    <div className="flex min-h-screen flex-col bg-[#e7edf3] text-slate-900">
      {bgUrl && (
        <div
          className="pointer-events-none fixed inset-0 opacity-20"
          style={{
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      <header className="relative z-10 bg-[#1b1d20] text-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {settings?.buildingLogoUrl ? (
              <img src={settings.buildingLogoUrl} alt="Property" className="max-h-12 object-contain" />
            ) : (
              <MvpLogo />
            )}
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-bold tracking-wide">MVP</div>
              <div className="text-[10px] font-medium tracking-[0.2em] text-white/80">CONDOS</div>
            </div>
          </div>

          <nav className="hidden flex-wrap items-center gap-4 text-[11px] font-medium uppercase tracking-wide text-white/90 lg:flex xl:gap-6">
            {MARKETING_HEADER_LINKS.map((item) => (
              <button
                key={item.page}
                type="button"
                className="transition hover:text-white"
                onClick={() => {
                  if (onOpenMarketing) {
                    onOpenMarketing(MARKETING_PATHS[item.page]);
                    return;
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <button type="button" className="text-white/90 transition hover:text-white">
              Sign In
            </button>
            <button
              type="button"
              className="text-white/90 transition hover:text-white"
              onClick={() => alert("Register — coming soon.")}
            >
              Register
            </button>
            <button
              type="button"
              className="rounded px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
              style={{ backgroundColor: themeColor }}
              onClick={() => alert("Sign Up — coming soon.")}
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
        {settings?.aboutBuilding && (
          <p className="max-w-lg text-center text-sm text-slate-600">{settings.aboutBuilding}</p>
        )}
        {children}
        {publicDocs.length > 0 && (
          <div className="w-full max-w-md rounded border border-slate-200 bg-white/90 p-4 text-sm shadow-sm">
            <h3 className="mb-2 font-semibold text-slate-700">Public Documents</h3>
            <ul className="space-y-1">
              {publicDocs.map((d) => (
                <li key={d.id}>
                  <button type="button" className="text-[#3476ef] hover:underline" style={{ color: themeColor }}>
                    {d.title}
                  </button>
                  <span className="text-slate-400"> — {d.filename}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <footer className="relative z-10 bg-[#1b1d20] text-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6">
          {settings?.facebookUrl ? (
            <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="text-white/80 hover:text-white">
              <FaFacebookF />
            </a>
          ) : (
            <span />
          )}
          <p className="text-center text-xs text-white/70 sm:text-sm">
            {new Date().getFullYear()} © Copyright mvpcondos.com All Rights Reserved.
          </p>
          <div className="flex gap-3">
            {settings?.twitterUrl && (
              <a href={settings.twitterUrl} target="_blank" rel="noreferrer" className="text-white/80 hover:text-white">
                <FaTwitter />
              </a>
            )}
            {settings?.instaUrl && (
              <a href={settings.instaUrl} target="_blank" rel="noreferrer" className="text-white/80 hover:text-white">
                <FaInstagram />
              </a>
            )}
            {settings?.youTubeUrl && (
              <a href={settings.youTubeUrl} target="_blank" rel="noreferrer" className="text-white/80 hover:text-white">
                <FaYoutube />
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
