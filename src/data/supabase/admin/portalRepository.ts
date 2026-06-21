import type {
  CustomPortalTile,
  PortalImage,
  PortalImageKind,
  PortalModuleConfig,
  PortalSettings,
  PortalTileSettings,
  ProfileFieldOption,
  PublicPortalDocument,
  PublicPortalSettings,
  RegistrationFieldOption,
} from "../../../resident/data/types";
import { normalizePortalLayout } from "../../../resident/data/portalTileLayout";
import { normalizeExternalUrl } from "../../../shared/urlUtils";
import { buildLobbyDisplayUrl } from "../../../shared/portalDomain";
import { DEFAULT_PORTAL_MODULES } from "../../defaults/portalModules";
import { mapDbError, sb } from "../base";
import { bid } from "./shared";

function portalModuleInsertRow(buildingId: string, m: (typeof DEFAULT_PORTAL_MODULES)[number]) {
  return {
    building_id: buildingId,
    module_id: m.moduleId,
    name: m.name,
    tile_label: m.tileLabel,
    enabled: m.enabled,
    message: m.message,
    sort_order: m.sortOrder ?? 0,
    layout_zone: m.layoutZone ?? "primary",
    locked: m.locked ?? false,
  };
}

export async function syncMissingPortalModules(buildingId: string) {
  const { data, error } = await sb()
    .from("portal_modules")
    .select("module_id")
    .eq("building_id", buildingId);
  mapDbError(error);
  const existingIds = new Set((data ?? []).map((row) => row.module_id as string));
  const missing = DEFAULT_PORTAL_MODULES.filter((m) => !existingIds.has(m.moduleId));
  if (missing.length === 0) return;

  const { error: insertError } = await sb()
    .from("portal_modules")
    .insert(missing.map((m) => portalModuleInsertRow(buildingId, m)));
  mapDbError(insertError);
}

export async function ensureDefaultPortalModules(buildingId: string) {
  const { count, error: countError } = await sb()
    .from("portal_modules")
    .select("*", { count: "exact", head: true })
    .eq("building_id", buildingId);
  mapDbError(countError);
  if ((count ?? 0) === 0) {
    const { error } = await sb()
      .from("portal_modules")
      .insert(DEFAULT_PORTAL_MODULES.map((m) => portalModuleInsertRow(buildingId, m)));
    mapDbError(error);
  }
  await syncMissingPortalModules(buildingId);
}

function mapPortalModule(row: Record<string, unknown>): PortalModuleConfig {
  return {
    moduleId: row.module_id as string,
    name: row.name as string,
    tileLabel: row.tile_label as string,
    enabled: row.enabled as boolean,
    message: row.message as string,
    sortOrder: row.sort_order as number,
    layoutZone: row.layout_zone as PortalModuleConfig["layoutZone"],
    locked: row.locked as boolean,
  };
}

function mapCustomTile(row: Record<string, unknown>): CustomPortalTile {
  return {
    id: row.id as string,
    title: row.title as string,
    enabled: row.enabled as boolean,
    actionType: row.action_type as string,
    target: row.target as string | undefined,
    sortOrder: row.sort_order as number,
    layoutZone: row.layout_zone as CustomPortalTile["layoutZone"],
  };
}

async function loadPortalModules(buildingId: string) {
  const { data, error } = await sb()
    .from("portal_modules")
    .select("*")
    .eq("building_id", buildingId)
    .order("sort_order", { ascending: true });
  mapDbError(error);
  return (data ?? []).map((m) => mapPortalModule(m as Record<string, unknown>));
}

async function loadCustomTiles(buildingId: string) {
  const { data, error } = await sb()
    .from("custom_portal_tiles")
    .select("*")
    .eq("building_id", buildingId)
    .order("sort_order", { ascending: true });
  mapDbError(error);
  return (data ?? []).map((t) => mapCustomTile(t as Record<string, unknown>));
}

async function loadTileSettings(buildingId: string): Promise<PortalTileSettings> {
  const { data, error } = await sb()
    .from("portal_tile_settings")
    .select("*")
    .eq("building_id", buildingId)
    .maybeSingle();
  mapDbError(error);
  return {
    portalTileOpacity: Number(data?.portal_tile_opacity ?? 1),
    defaultLanguage: (data?.default_language as string) ?? "English",
    primaryTileLimit: (data?.primary_tile_limit as number) ?? 12,
    useMasterLayout: (data?.use_master_layout as boolean) ?? false,
  };
}

async function persistPortalLayout(
  buildingId: string,
  modules: PortalModuleConfig[],
  customTiles: CustomPortalTile[],
  tileSettings: PortalTileSettings
) {
  await sb().from("portal_modules").delete().eq("building_id", buildingId);
  if (modules.length) {
    await sb().from("portal_modules").insert(
      modules.map((m) => ({
        building_id: buildingId,
        module_id: m.moduleId,
        name: m.name,
        tile_label: m.tileLabel,
        enabled: m.enabled,
        message: m.message,
        sort_order: m.sortOrder ?? 0,
        layout_zone: m.layoutZone ?? "primary",
        locked: m.locked ?? false,
      }))
    );
  }
  await sb().from("custom_portal_tiles").delete().eq("building_id", buildingId);
  if (customTiles.length) {
    await sb().from("custom_portal_tiles").insert(
      customTiles.map((t) => ({
        building_id: buildingId,
        title: t.title,
        enabled: t.enabled,
        action_type: t.actionType,
        target: t.target,
        sort_order: t.sortOrder ?? 0,
        layout_zone: t.layoutZone ?? "primary",
      }))
    );
  }
  await sb().from("portal_tile_settings").upsert({
    building_id: buildingId,
    portal_tile_opacity: tileSettings.portalTileOpacity,
    default_language: tileSettings.defaultLanguage,
    primary_tile_limit: tileSettings.primaryTileLimit,
    use_master_layout: tileSettings.useMasterLayout,
  });
}

export const portalRepository = {
  async getPortalSettings(): Promise<PortalSettings> {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("portal_settings")
      .select("*")
      .eq("building_id", buildingId)
      .maybeSingle();
    mapDbError(error);
    return {
      enableDocuments: data?.enable_documents ?? true,
      enableEvents: data?.enable_events ?? true,
      enableGallery: data?.enable_gallery ?? true,
      enableFaq: data?.enable_faq ?? true,
      enableServiceRequests: data?.enable_service_requests ?? true,
      enableSuggestions: data?.enable_suggestions ?? true,
      enableIncidentReports: data?.enable_incident_reports ?? true,
      defaultLanguage: data?.default_language ?? "English",
    };
  },

  async updatePortalSettings(updates: Partial<PortalSettings>) {
    const buildingId = await bid();
    const current = await this.getPortalSettings();
    const merged = { ...current, ...updates };
    await sb().from("portal_settings").upsert({
      building_id: buildingId,
      enable_documents: merged.enableDocuments,
      enable_events: merged.enableEvents,
      enable_gallery: merged.enableGallery,
      enable_faq: merged.enableFaq,
      enable_service_requests: merged.enableServiceRequests,
      enable_suggestions: merged.enableSuggestions,
      enable_incident_reports: merged.enableIncidentReports,
      default_language: merged.defaultLanguage,
    });
    return merged;
  },

  async getPublicPortalSettings(): Promise<PublicPortalSettings> {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("public_portal_settings")
      .select("*")
      .eq("building_id", buildingId)
      .maybeSingle();
    mapDbError(error);
    return {
      portalThemeColor: (data?.portal_theme_color as string) ?? "#3476ef",
      subdomain: (data?.subdomain as string) ?? "",
      aboutBuilding: (data?.about_building as string) ?? "",
      buildingLogoUrl: data?.building_logo_url as string | undefined,
      enableLobbyDisplay: (data?.enable_lobby_display as boolean) ?? false,
      lobbyDisplayUrl: (data?.lobby_display_url as string) ?? "",
      twitterUrl: normalizeExternalUrl((data?.twitter_url as string) ?? ""),
      facebookUrl: normalizeExternalUrl((data?.facebook_url as string) ?? ""),
      instaUrl: normalizeExternalUrl((data?.insta_url as string) ?? ""),
      youTubeUrl: normalizeExternalUrl((data?.youtube_url as string) ?? ""),
    };
  },

  async updatePublicPortalSettings(updates: Partial<PublicPortalSettings>) {
    const buildingId = await bid();
    const current = await this.getPublicPortalSettings();
    const merged = { ...current, ...updates };
    const lobbyDisplayUrl = buildLobbyDisplayUrl(merged.subdomain);
    await sb().from("public_portal_settings").upsert({
      building_id: buildingId,
      portal_theme_color: merged.portalThemeColor,
      subdomain: merged.subdomain,
      about_building: merged.aboutBuilding,
      building_logo_url: merged.buildingLogoUrl,
      enable_lobby_display: merged.enableLobbyDisplay,
      lobby_display_url: lobbyDisplayUrl,
      twitter_url: merged.twitterUrl,
      facebook_url: merged.facebookUrl,
      insta_url: merged.instaUrl,
      youtube_url: merged.youTubeUrl,
    });
    return { ...merged, lobbyDisplayUrl };
  },

  async getPortalImages(kind?: PortalImageKind) {
    const buildingId = await bid();
    let query = sb().from("portal_images").select("*").eq("building_id", buildingId);
    if (kind) query = query.eq("kind", kind);
    const { data, error } = await query.order("sort_order", { ascending: true });
    mapDbError(error);
    return (data ?? []).map((i) => ({
      id: i.id as string,
      kind: i.kind as PortalImageKind,
      url: i.url as string,
      sortOrder: i.sort_order as number,
    }));
  },

  async createPortalImage(input: Omit<PortalImage, "id">) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("portal_images")
      .insert({
        building_id: buildingId,
        kind: input.kind,
        url: input.url,
        sort_order: input.sortOrder,
      })
      .select("*")
      .single();
    mapDbError(error);
    return {
      id: data!.id as string,
      kind: data!.kind as PortalImageKind,
      url: data!.url as string,
      sortOrder: data!.sort_order as number,
    };
  },

  async updatePortalImage(id: string, updates: Partial<PortalImage>) {
    const payload: Record<string, unknown> = {};
    if (updates.kind !== undefined) payload.kind = updates.kind;
    if (updates.url !== undefined) payload.url = updates.url;
    if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;
    const { data, error } = await sb().from("portal_images").update(payload).eq("id", id).select("*").maybeSingle();
    mapDbError(error);
    return data
      ? {
          id: data.id as string,
          kind: data.kind as PortalImageKind,
          url: data.url as string,
          sortOrder: data.sort_order as number,
        }
      : null;
  },

  async deletePortalImage(id: string) {
    await sb().from("portal_images").delete().eq("id", id);
  },

  async getPublicPortalDocuments() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("public_portal_documents")
      .select("*")
      .eq("building_id", buildingId)
      .order("uploaded_at", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((d) => ({
      id: d.id as string,
      title: d.title as string,
      filename: d.filename as string,
      uploadedAt: String(d.uploaded_at),
    }));
  },

  async createPublicPortalDocument(input: Omit<PublicPortalDocument, "id">) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("public_portal_documents")
      .insert({
        building_id: buildingId,
        title: input.title,
        filename: input.filename,
      })
      .select("*")
      .single();
    mapDbError(error);
    return {
      id: data!.id as string,
      title: data!.title as string,
      filename: data!.filename as string,
      uploadedAt: String(data!.uploaded_at),
    };
  },

  async deletePublicPortalDocument(id: string) {
    await sb().from("public_portal_documents").delete().eq("id", id);
  },

  async getPortalModules() {
    const buildingId = await bid();
    await ensureDefaultPortalModules(buildingId);
    return loadPortalModules(buildingId);
  },

  async updatePortalModules(modules: PortalModuleConfig[]) {
    const buildingId = await bid();
    const customTiles = await loadCustomTiles(buildingId);
    const tileSettings = await loadTileSettings(buildingId);
    const normalized = normalizePortalLayout(
      modules.map((m) => ({ ...m })),
      customTiles,
      tileSettings.primaryTileLimit
    );
    await persistPortalLayout(buildingId, normalized.modules, normalized.customTiles, tileSettings);
    return normalized.modules;
  },

  async getPortalTileSettings() {
    const buildingId = await bid();
    return loadTileSettings(buildingId);
  },

  async updatePortalTileSettings(updates: Partial<PortalTileSettings>) {
    const buildingId = await bid();
    const current = await loadTileSettings(buildingId);
    const merged = { ...current, ...updates };
    const modules = await loadPortalModules(buildingId);
    const customTiles = await loadCustomTiles(buildingId);
    const normalized = normalizePortalLayout(modules, customTiles, merged.primaryTileLimit);
    await persistPortalLayout(buildingId, normalized.modules, normalized.customTiles, merged);
    return merged;
  },

  async getCustomPortalTiles() {
    const buildingId = await bid();
    return loadCustomTiles(buildingId);
  },

  async updateCustomPortalTiles(tiles: CustomPortalTile[]) {
    const buildingId = await bid();
    const modules = await loadPortalModules(buildingId);
    const tileSettings = await loadTileSettings(buildingId);
    const normalized = normalizePortalLayout(
      modules,
      tiles.map((t) => ({ ...t })),
      tileSettings.primaryTileLimit
    );
    await persistPortalLayout(buildingId, normalized.modules, normalized.customTiles, tileSettings);
    return normalized.customTiles;
  },

  async getCompanyMasterPortalModules() {
    return [];
  },

  async updateCompanyMasterPortalModules(modules: PortalModuleConfig[]) {
    return modules;
  },

  async getCompanyMasterCustomPortalTiles() {
    return [];
  },

  async updateCompanyMasterCustomPortalTiles(tiles: CustomPortalTile[]) {
    return tiles;
  },

  async getCompanyMasterPrimaryTileLimit() {
    return 12;
  },

  async updateCompanyMasterPrimaryTileLimit(primaryTileLimit: number) {
    return Math.max(1, Math.floor(primaryTileLimit));
  },

  async resetBuildingPortalLayoutToMaster() {
    const buildingId = await bid();
    const tileSettings = await loadTileSettings(buildingId);
    await sb().from("portal_tile_settings").upsert({
      building_id: buildingId,
      use_master_layout: true,
      primary_tile_limit: tileSettings.primaryTileLimit,
    });
    return true;
  },

  async getRegistrationFieldOptions() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("registration_field_options")
      .select("*")
      .eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? []).map((f) => ({
      fieldKey: f.field_key as string,
      label: f.label as string,
      include: f.include_field as boolean,
      required: f.required_field as boolean,
      locked: f.locked as boolean,
      note: f.note as string | undefined,
    }));
  },

  async updateRegistrationFieldOptions(fields: RegistrationFieldOption[]) {
    const buildingId = await bid();
    for (const f of fields) {
      await sb().from("registration_field_options").upsert({
        building_id: buildingId,
        field_key: f.fieldKey,
        label: f.label,
        include_field: f.include,
        required_field: f.required,
        locked: f.locked,
        note: f.note,
      });
    }
    return this.getRegistrationFieldOptions();
  },

  async getProfileFieldOptions() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("profile_field_options")
      .select("*")
      .eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? []).map((f) => ({
      fieldKey: f.field_key as string,
      label: f.label as string,
      show: f.show_field as boolean,
      editable: f.editable_field as boolean,
      locked: f.locked as boolean,
      note: f.note as string | undefined,
    }));
  },

  async updateProfileFieldOptions(fields: ProfileFieldOption[]) {
    const buildingId = await bid();
    for (const f of fields) {
      await sb().from("profile_field_options").upsert({
        building_id: buildingId,
        field_key: f.fieldKey,
        label: f.label,
        show_field: f.show,
        editable_field: f.editable,
        locked: f.locked,
        note: f.note,
      });
    }
    return this.getProfileFieldOptions();
  },
};
