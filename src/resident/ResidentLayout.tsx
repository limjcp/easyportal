import { useEffect, useState, type ReactNode } from "react";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import { useAuth } from "../auth/AuthProvider";
import { getActiveBuildingId } from "../data/supabase/buildingContext";
import { MvpLogo } from "../shared/MvpLogo";
import { normalizeExternalUrl } from "../shared/urlUtils";
import { ResidentNav } from "./components/ResidentNav";
import { UserMenu } from "./components/UserMenu";
import { usePortalConfig } from "./context/PortalConfigContext";
import { getResidentBackgroundImage } from "./data/portalConfig";
import { residentRepo } from "./data/mockRepository";
import type { ResidentRoute } from "./navigation";
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
  const auth = useAuth();
  const themeColor = publicPortalSettings.portalThemeColor;
  const bg = getResidentBackgroundImage();
  const showBuildingAdmin = auth.portalAccess?.portals.includes("building") ?? false;

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
          showBuildingAdmin={showBuildingAdmin}
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
  showBuildingAdmin,
}: {
  onSwitchToAdmin: () => void;
  facebookUrl: string;
  instaUrl: string;
  twitterUrl: string;
  youTubeUrl: string;
  themeColor: string;
  showBuildingAdmin: boolean;
}) {
  return (
    <div className="sticky top-0 z-50 bg-[#1b1d20]/95">
      <div className="mx-auto flex max-w-[1500px] items-center justify-end gap-4 px-4 py-3 text-sm text-white/80 sm:px-6">
        {twitterUrl && (
          <a href={normalizeExternalUrl(twitterUrl)} target="_blank" rel="noreferrer" className="transition hover:text-white" aria-label="Twitter">
            <FaTwitter />
          </a>
        )}
        {facebookUrl && (
          <a href={normalizeExternalUrl(facebookUrl)} target="_blank" rel="noreferrer" className="transition hover:text-white" aria-label="Facebook">
            <FaFacebookF />
          </a>
        )}
        {instaUrl && (
          <a href={normalizeExternalUrl(instaUrl)} target="_blank" rel="noreferrer" className="transition hover:text-white" aria-label="Instagram">
            <FaInstagram />
          </a>
        )}
        {youTubeUrl && (
          <a href={normalizeExternalUrl(youTubeUrl)} target="_blank" rel="noreferrer" className="transition hover:text-white" aria-label="YouTube">
            <FaYoutube />
          </a>
        )}
        {showBuildingAdmin ? (
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:opacity-90 sm:text-sm"
            style={{ backgroundColor: themeColor }}
          >
            Building Admin
          </button>
        ) : null}
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
  const auth = useAuth();
  const activeBuildingId = getActiveBuildingId();
  const [userName, setUserName] = useState("…");
  const [unit, setUnit] = useState("…");
  const [buildingName, setBuildingName] = useState("Loading…");
  const [buildingAddress, setBuildingAddress] = useState("");

  useEffect(() => {
    if (!auth.session?.user || !activeBuildingId) return;
    residentRepo
      .getUser()
      .then((user) => {
        setUserName(user.name);
        setUnit(user.unit || "—");
        setBuildingName(user.buildingName || "Building");
        setBuildingAddress(user.buildingAddress ?? "");
      })
      .catch(() => {
        setUserName("Resident");
        setUnit("—");
        setBuildingName("Building");
        setBuildingAddress("");
      });
  }, [auth.session?.user?.id, activeBuildingId]);

  const headerSubtitle = buildingAddress
    ? `${buildingName} — ${buildingAddress}`
    : buildingName;

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
        <div className="hidden flex-1 flex-col px-4 text-center md:block">
          <div className="text-base font-semibold text-slate-700">{buildingName}</div>
          {buildingAddress ? (
            <div className="text-sm text-slate-500">{buildingAddress}</div>
          ) : null}
        </div>
        <div className="shrink-0">
          <UserMenu
            userName={userName}
            buildingName={buildingName}
            unit={unit}
            onProfile={onOpenProfile}
            onLogout={onLogout}
          />
        </div>
      </div>
      <div className="border-t border-slate-100 px-4 pb-3 text-center md:hidden">
        <div className="text-sm font-semibold text-slate-700">{headerSubtitle}</div>
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
