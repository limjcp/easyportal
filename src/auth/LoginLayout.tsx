import { useEffect, useState, type ReactNode } from "react";
import { DEFAULT_HERO_IMAGE } from "../marketing/constants";
import { MarketingFooter } from "../marketing/components/MarketingFooter";
import { MarketingHeader } from "../marketing/components/MarketingHeader";
import { pe } from "../marketing/typography";
import { getPortalConfig, getPublicBackgroundImages, loadPortalConfig, setCachedPortalConfig } from "../resident/data/portalConfig";
import type { PublicPortalDocument, PublicPortalSettings } from "../resident/data/types";

type LoginLayoutProps = {
  children: ReactNode;
  onOpenMarketing?: (path?: string) => void;
};

export function LoginLayout({ children, onOpenMarketing }: LoginLayoutProps) {
  const [settings, setSettings] = useState<PublicPortalSettings | null>(null);
  const [publicDocs, setPublicDocs] = useState<PublicPortalDocument[]>([]);
  const [bgUrl, setBgUrl] = useState<string | undefined>();

  useEffect(() => {
    loadPortalConfig()
      .then((config) => {
        setCachedPortalConfig(config);
        setSettings(config.publicPortalSettings);
        setPublicDocs(config.publicPortalDocuments);
        setBgUrl(getPublicBackgroundImages(config)[0]?.url);
      })
      .catch(() => {
        const config = getPortalConfig();
        setSettings(config.publicPortalSettings);
        setPublicDocs(config.publicPortalDocuments);
      });
  }, []);

  const heroImage = bgUrl ?? DEFAULT_HERO_IMAGE;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <MarketingHeader
        currentPage="home"
        solidHeader
        onNavigate={(path) => onOpenMarketing?.(path)}
        onOpenLogin={() => undefined}
      />

      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden lg:flex min-h-[calc(100vh-0px)] flex-col justify-end overflow-hidden">
          <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-foreground/50" />
          <div className="relative z-10 px-12 lg:px-20 pb-20 pt-32">
            <p className={`${pe.eyebrow} text-background/50 mb-6`}>MVP Condos Portal</p>
            <h2 className={`${pe.sectionTitleLg} text-background max-w-md`}>
              {settings?.aboutBuilding ?? "Your community portal for residents, boards, and management."}
            </h2>
          </div>
        </div>

        <main className="flex flex-col justify-center px-6 pt-28 pb-16 md:px-12 lg:px-20 lg:py-28">
          {settings?.aboutBuilding && (
            <p className={`mb-8 max-w-md ${pe.bodySm} text-muted-foreground lg:hidden`}>
              {settings.aboutBuilding}
            </p>
          )}
          {children}
          {publicDocs.length > 0 && (
            <div className="mt-12 w-full max-w-md border-t border-border pt-8">
              <p className={`${pe.eyebrow} text-muted-foreground mb-5`}>Public Documents</p>
              <ul className="divide-y divide-border">
                {publicDocs.map((doc) => (
                  <li key={doc.id} className="py-4">
                    <button
                      type="button"
                      className={`${pe.bodySm} font-light tracking-tight text-foreground hover:text-muted-foreground transition-colors duration-300`}
                    >
                      {doc.title}
                    </button>
                    <p className={`mt-1 ${pe.caption} text-muted-foreground`}>{doc.filename}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>

      <MarketingFooter onNavigate={(path) => onOpenMarketing?.(path)} />
    </div>
  );
}
