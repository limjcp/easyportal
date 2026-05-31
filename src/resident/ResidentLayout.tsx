import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import { MvpLogo } from "../shared/MvpLogo";
import { ResidentNav } from "./components/ResidentNav";
import { UserMenu } from "./components/UserMenu";
import { usePortalConfig } from "./context/PortalConfigContext";
import { getResidentBackgroundImage } from "./data/portalConfig";
import type { ResidentRoute } from "./navigation";
import type { ReactNode } from "react";

const BUILDING_ADDRESS = "(WNCC 87) 236 Kingswood Drive Kitchener Ontario N2E 2K2";

type ResidentLayoutProps = {
  route: ResidentRoute;
  onNavigate: (route: ResidentRoute) => void;
  onSwitchToAdmin: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  navAction?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
};

export function ResidentLayout({
  route,
  onNavigate,
  onSwitchToAdmin,
  onOpenProfile,
  onLogout,
  navAction,
  children,
  fullWidth,
}: ResidentLayoutProps) {
  const { publicPortalSettings, portalTileSettings } = usePortalConfig();
  const themeColor = publicPortalSettings.portalThemeColor;
  const bg = getResidentBackgroundImage();

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-950 text-white"
      style={{ ["--portal-primary" as string]: themeColor }}
    >
      <HeroBackground imageUrl={bg?.url} themeColor={themeColor} />
      <div className="relative z-10 flex min-h-screen flex-col">
        <UtilityBar
          onSwitchToAdmin={onSwitchToAdmin}
          facebookUrl={publicPortalSettings.facebookUrl}
          instaUrl={publicPortalSettings.instaUrl}
          twitterUrl={publicPortalSettings.twitterUrl}
          youTubeUrl={publicPortalSettings.youTubeUrl}
          themeColor={themeColor}
        />
        <Header onOpenProfile={onOpenProfile} onLogout={onLogout} logoUrl={publicPortalSettings.buildingLogoUrl} />
        <ResidentNav route={route} onNavigate={onNavigate} rightAction={navAction} />
        <main
          className={
            fullWidth
              ? "mx-auto w-full max-w-[1200px] flex-1 px-4 pb-24 pt-4 sm:px-6"
              : "mx-auto flex w-full max-w-[980px] flex-1 flex-col px-4 pb-24 pt-4 sm:px-6 sm:pt-8 lg:max-w-[1040px] lg:pt-10"
          }
        >
          {children}
        </main>
        <Footer defaultLanguage={portalTileSettings.defaultLanguage} />
      </div>
    </div>
  );
}

function HeroBackground({ imageUrl, themeColor }: { imageUrl?: string; themeColor: string }) {
  const bgImage = imageUrl
    ? `url(${imageUrl})`
    : "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 40%, #4a7ab0 100%), url('/images/condo-courtyard.svg')";

  return (
    <>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: bgImage }} />
      <div className="absolute inset-0 bg-slate-950/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0a2c66]/20" />
      <div
        className="absolute -bottom-16 right-[-8%] h-[62vh] w-[52vw] min-w-[420px] rounded-[4rem] opacity-80"
        style={{
          clipPath: "polygon(24% 0%, 100% 0%, 100% 100%, 0% 100%)",
          background: `linear-gradient(to bottom right, ${themeColor}33, ${themeColor}73, #0f3e8e80)`,
        }}
      />
    </>
  );
}

function UtilityBar({
  onSwitchToAdmin,
  facebookUrl,
  instaUrl,
  twitterUrl,
  youTubeUrl,
  themeColor,
}: {
  onSwitchToAdmin: () => void;
  facebookUrl: string;
  instaUrl: string;
  twitterUrl: string;
  youTubeUrl: string;
  themeColor: string;
}) {
  return (
    <div className="bg-[#1b1d20]/95">
      <div className="mx-auto flex max-w-[1500px] items-center justify-end gap-4 px-4 py-3 text-sm text-white/80 sm:px-6">
        {twitterUrl && (
          <a href={twitterUrl} target="_blank" rel="noreferrer" className="transition hover:text-white" aria-label="Twitter">
            <FaTwitter />
          </a>
        )}
        {facebookUrl && (
          <a href={facebookUrl} target="_blank" rel="noreferrer" className="transition hover:text-white" aria-label="Facebook">
            <FaFacebookF />
          </a>
        )}
        {instaUrl && (
          <a href={instaUrl} target="_blank" rel="noreferrer" className="transition hover:text-white" aria-label="Instagram">
            <FaInstagram />
          </a>
        )}
        {youTubeUrl && (
          <a href={youTubeUrl} target="_blank" rel="noreferrer" className="transition hover:text-white" aria-label="YouTube">
            <FaYoutube />
          </a>
        )}
        <button
          type="button"
          onClick={onSwitchToAdmin}
          className="inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:opacity-90 sm:text-sm"
          style={{ backgroundColor: themeColor }}
        >
          Building Admin
        </button>
      </div>
    </div>
  );
}

function Header({
  onOpenProfile,
  onLogout,
  logoUrl,
}: {
  onOpenProfile: () => void;
  onLogout: () => void;
  logoUrl?: string;
}) {
  return (
    <div className="bg-white/95 shadow-[0_1px_0_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="Property logo" className="max-h-14 max-w-[200px] object-contain" />
          ) : (
            <MvpLogo featured />
          )}
        </div>
        <div className="hidden flex-1 px-4 text-center text-sm text-slate-500 md:block md:text-base">
          {BUILDING_ADDRESS}
        </div>
        <div className="shrink-0">
          <UserMenu userName="Claudio" unit="102" onProfile={onOpenProfile} onLogout={onLogout} />
        </div>
      </div>
      <div className="border-t border-slate-100 px-4 pb-3 text-center text-sm text-slate-500 md:hidden">
        {BUILDING_ADDRESS}
      </div>
    </div>
  );
}

function Footer({ defaultLanguage }: { defaultLanguage: string }) {
  return (
    <div className="mt-auto border-t border-white/20 px-4 py-8">
      <div className="mx-auto flex max-w-[860px] flex-col items-center gap-7 text-center md:flex-row md:items-center md:justify-center md:gap-20">
        <p className="text-lg text-white/80">
          Powered By <span className="font-medium text-white">mvpcondos.com</span>
        </p>
        <label className="inline-flex items-center gap-2 rounded-sm border border-white/20 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm">
          <span aria-hidden="true">🇺🇸</span>
          <select className="bg-transparent pr-2 outline-none" defaultValue={defaultLanguage}>
            <option>English</option>
            <option>Français</option>
          </select>
        </label>
      </div>
    </div>
  );
}
