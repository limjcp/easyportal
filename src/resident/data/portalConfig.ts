import type {
  CustomPortalTile,
  PortalConfig,
  PortalImage,
  PortalModuleConfig,
  PortalSettings,
  PortalTileSettings,
  ProfileCompletionPolicy,
  ProfileFieldOption,
  PublicPortalDocument,
  PublicPortalSettings,
  RegistrationFieldOption,
} from "./types";
import { normalizePortalLayout } from "./portalTileLayout";
import { adminRepository } from "../../admin/data/adminRepository";
import { getActiveBuildingId } from "../../data/supabase/buildingContext";
import { requireSupabase } from "../../lib/supabaseClient";
import {
  applyPortalModuleAccess,
  getEffectivePortalModuleAccessForUser,
} from "../../data/supabase/portalModulePermissions";

function syncLegacyPortalSettings(modules: PortalModuleConfig[], tile: PortalTileSettings): PortalSettings {
  const isOn = (id: string) => modules.find((m) => m.moduleId === id)?.enabled ?? false;
  return {
    enableDocuments: isOn("documents"),
    enableEvents: isOn("events"),
    enableGallery: isOn("galleries"),
    enableFaq: isOn("faq"),
    enableServiceRequests: isOn("serviceRequest"),
    enableSuggestions: isOn("suggestion"),
    enableIncidentReports: isOn("incidentReport"),
    defaultLanguage: tile.defaultLanguage,
  };
}

const defaultPublicPortalSettings: PublicPortalSettings = {
  portalThemeColor: "#3476ef",
  subdomain: "",
  aboutBuilding: "",
  enableLobbyDisplay: false,
  lobbyDisplayUrl: "",
  twitterUrl: "",
  facebookUrl: "",
  instaUrl: "",
  youTubeUrl: "",
};

const defaultTileSettings: PortalTileSettings = {
  primaryTileLimit: 6,
  defaultLanguage: "English",
  useMasterLayout: false,
};

const defaultProfileCompletionPolicy: ProfileCompletionPolicy = {
  enabled: false,
  residentTypes: ["Owner", "Absentee Owner"],
  softLoginCount: 2,
  blockLoginCount: 3,
};

export async function loadPortalConfig(): Promise<PortalConfig> {
  const [
    publicPortalSettings,
    portalImages,
    publicPortalDocuments,
    portalModules,
    portalTileSettings,
    customPortalTiles,
    registrationFieldOptions,
    profileFieldOptions,
    profileCompletionPolicy,
  ] = await Promise.all([
    adminRepository.getPublicPortalSettings(),
    adminRepository.getPortalImages(),
    adminRepository.getPublicPortalDocuments(),
    adminRepository.getPortalModules(),
    adminRepository.getPortalTileSettings(),
    adminRepository.getCustomPortalTiles(),
    adminRepository.getRegistrationFieldOptions(),
    adminRepository.getProfileFieldOptions(),
    adminRepository.getProfileCompletionPolicy(),
  ]);

  const source = portalTileSettings.useMasterLayout ? "master" : "building";
  let sourceModules = portalModules;
  let sourceCustomTiles = customPortalTiles;
  let sourcePrimaryLimit = portalTileSettings.primaryTileLimit;

  if (source === "master") {
    sourceModules = await adminRepository.getCompanyMasterPortalModules();
    sourceCustomTiles = await adminRepository.getCompanyMasterCustomPortalTiles();
    sourcePrimaryLimit = await adminRepository.getCompanyMasterPrimaryTileLimit();
  }

  const normalized = normalizePortalLayout(sourceModules, sourceCustomTiles, sourcePrimaryLimit);

  let filteredModules = normalized.modules.map((m) => ({ ...m }));
  try {
    const client = requireSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    const buildingId = getActiveBuildingId();
    if (user && buildingId) {
      const access = await getEffectivePortalModuleAccessForUser(user.id, buildingId);
      filteredModules = applyPortalModuleAccess(filteredModules, access);
    }
  } catch {
    // Non-resident contexts keep building-level module visibility.
  }

  return {
    publicPortalSettings: publicPortalSettings ?? defaultPublicPortalSettings,
    portalImages: portalImages.map((i) => ({ ...i })),
    publicPortalDocuments: publicPortalDocuments.map((d) => ({ ...d })),
    portalModules: filteredModules,
    portalTileSettings: {
      ...portalTileSettings,
      primaryTileLimit: sourcePrimaryLimit,
    },
    customPortalTiles: normalized.customTiles.map((t) => ({ ...t })),
    tileLayoutSource: source,
    registrationFieldOptions: registrationFieldOptions.map((f) => ({ ...f })),
    profileFieldOptions: profileFieldOptions.map((f) => ({ ...f })),
    profileCompletionPolicy,
  };
}

/** Fallback empty config for legacy callers without React context */
export function getPortalConfig(): PortalConfig {
  return {
    publicPortalSettings: defaultPublicPortalSettings,
    portalImages: [],
    publicPortalDocuments: [],
    portalModules: [],
    portalTileSettings: defaultTileSettings,
    customPortalTiles: [],
    tileLayoutSource: "building",
    registrationFieldOptions: [],
    profileFieldOptions: [],
    profileCompletionPolicy: defaultProfileCompletionPolicy,
  };
}

export function syncPortalSettingsFromModules(modules: PortalModuleConfig[], tile: PortalTileSettings) {
  return syncLegacyPortalSettings(modules, tile);
}

export function getResidentBackgroundImage(config?: PortalConfig): PortalImage | undefined {
  const cfg = config ?? getPortalConfig();
  return cfg.portalImages
    .filter((i) => i.kind === "resident")
    .sort((a, b) => a.sortOrder - b.sortOrder)[0];
}

export function getPublicBackgroundImages(config?: PortalConfig): PortalImage[] {
  const cfg = config ?? getPortalConfig();
  return cfg.portalImages
    .filter((i) => i.kind === "public")
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getModuleMessage(moduleId: string, config?: PortalConfig): string {
  const cfg = config ?? getPortalConfig();
  return cfg.portalModules.find((m) => m.moduleId === moduleId)?.message ?? "";
}

export type {
  PortalConfig,
  PublicPortalSettings,
  PortalImage,
  PublicPortalDocument,
  PortalModuleConfig,
  PortalTileSettings,
  CustomPortalTile,
  RegistrationFieldOption,
  ProfileFieldOption,
};
