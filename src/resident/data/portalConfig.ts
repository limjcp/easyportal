import type {
  CustomPortalTile,
  PortalConfig,
  PortalImage,
  PortalModuleConfig,
  PortalSettings,
  PortalTileSettings,
  ProfileFieldOption,
  PublicPortalDocument,
  PublicPortalSettings,
  RegistrationFieldOption,
} from "./types";
import { store } from "./sharedStore";
import { normalizePortalLayout } from "./portalTileLayout";

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

export function getPortalConfig(): PortalConfig {
  const source = store.portalTileSettings.useMasterLayout ? "master" : "building";
  const sourceModules =
    source === "master" ? store.companyMasterPortalModules : store.portalModules;
  const sourceCustomTiles =
    source === "master" ? store.companyMasterCustomPortalTiles : store.customPortalTiles;
  const sourcePrimaryLimit =
    source === "master"
      ? store.companyMasterPrimaryTileLimit
      : store.portalTileSettings.primaryTileLimit;
  const normalized = normalizePortalLayout(sourceModules, sourceCustomTiles, sourcePrimaryLimit);

  return {
    publicPortalSettings: { ...store.publicPortalSettings },
    portalImages: [...store.portalImages],
    publicPortalDocuments: [...store.publicPortalDocuments],
    portalModules: normalized.modules.map((m) => ({ ...m })),
    portalTileSettings: {
      ...store.portalTileSettings,
      primaryTileLimit: sourcePrimaryLimit,
    },
    customPortalTiles: normalized.customTiles.map((t) => ({ ...t })),
    tileLayoutSource: source,
    registrationFieldOptions: store.registrationFieldOptions.map((f) => ({ ...f })),
    profileFieldOptions: store.profileFieldOptions.map((f) => ({ ...f })),
  };
}

export function syncPortalSettingsFromModules() {
  store.portalSettings = syncLegacyPortalSettings(store.portalModules, store.portalTileSettings);
}

export function getResidentBackgroundImage(): PortalImage | undefined {
  return store.portalImages
    .filter((i) => i.kind === "resident")
    .sort((a, b) => a.sortOrder - b.sortOrder)[0];
}

export function getPublicBackgroundImages(): PortalImage[] {
  return store.portalImages
    .filter((i) => i.kind === "public")
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getModuleMessage(moduleId: string): string {
  return store.portalModules.find((m) => m.moduleId === moduleId)?.message ?? "";
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
