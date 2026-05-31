import type {
  CustomPortalTile,
  PortalModuleConfig,
  PortalTileLayoutZone,
} from "./types";

export const DEFAULT_PRIMARY_TILE_LIMIT = 8;

export type ArrangeTile = {
  id: string;
  label: string;
  enabled: boolean;
  layoutZone: PortalTileLayoutZone;
  sortOrder: number;
};

export function normalizeArrangeTiles(
  tiles: ArrangeTile[],
  primaryTileLimit: number
): ArrangeTile[] {
  const sorted = [...tiles].sort((a, b) => {
    if (a.layoutZone !== b.layoutZone) return a.layoutZone === "primary" ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });
  const primary = sorted.filter((tile) => tile.layoutZone === "primary");
  const compact = sorted.filter((tile) => tile.layoutZone === "compact");

  if (primary.length > primaryTileLimit) {
    compact.unshift(...primary.splice(primaryTileLimit));
  }

  return [
    ...primary.map((tile, idx) => ({ ...tile, layoutZone: "primary" as const, sortOrder: idx + 1 })),
    ...compact.map((tile, idx) => ({ ...tile, layoutZone: "compact" as const, sortOrder: idx + 1 })),
  ];
}

export function mergeArrangeTiles(
  baseTiles: ArrangeTile[],
  personalTiles: ArrangeTile[] | null,
  primaryTileLimit: number
): ArrangeTile[] {
  if (!personalTiles || personalTiles.length === 0) {
    return normalizeArrangeTiles(baseTiles, primaryTileLimit);
  }

  const allowedIds = new Set(baseTiles.map((tile) => tile.id));
  const personalById = new Map(
    personalTiles
      .filter((tile) => allowedIds.has(tile.id))
      .map((tile) => [tile.id, tile] as const)
  );

  const merged = baseTiles.map((tile) => {
    const override = personalById.get(tile.id);
    if (!override) return tile;
    return {
      ...tile,
      layoutZone: override.layoutZone,
      sortOrder: override.sortOrder,
    };
  });
  return normalizeArrangeTiles(merged, primaryTileLimit);
}

export function moveArrangeTile(
  tiles: ArrangeTile[],
  draggedId: string,
  targetZone: PortalTileLayoutZone,
  targetIndex: number,
  primaryTileLimit: number
): ArrangeTile[] {
  const draggedTile = tiles.find((tile) => tile.id === draggedId);
  if (!draggedTile) return tiles;

  const sourcePrimary = tiles
    .filter((tile) => tile.layoutZone === "primary" && tile.id !== draggedId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const sourceCompact = tiles
    .filter((tile) => tile.layoutZone === "compact" && tile.id !== draggedId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const nextTile = { ...draggedTile, layoutZone: targetZone };
  const destination = targetZone === "primary" ? sourcePrimary : sourceCompact;
  const boundedIndex = Math.max(0, Math.min(targetIndex, destination.length));
  destination.splice(boundedIndex, 0, nextTile);

  const normalizedPrimary = sourcePrimary.map((tile, idx) => ({
    ...tile,
    layoutZone: "primary" as const,
    sortOrder: idx + 1,
  }));
  const normalizedCompact = sourceCompact.map((tile, idx) => ({
    ...tile,
    layoutZone: "compact" as const,
    sortOrder: idx + 1,
  }));

  return normalizeArrangeTiles([...normalizedPrimary, ...normalizedCompact], primaryTileLimit);
}

type CombinedTile =
  | { kind: "module"; id: string; item: PortalModuleConfig }
  | { kind: "custom"; id: string; item: CustomPortalTile };

function normalizeZone(
  zone: PortalTileLayoutZone | undefined,
  index: number,
  primaryTileLimit: number
): PortalTileLayoutZone {
  if (zone === "primary" || zone === "compact") return zone;
  return index < primaryTileLimit ? "primary" : "compact";
}

function combineAndSort(
  modules: PortalModuleConfig[],
  customTiles: CustomPortalTile[],
  primaryTileLimit: number
): CombinedTile[] {
  const withOrder: Array<CombinedTile & { _zone: PortalTileLayoutZone; _order: number }> = [
    ...modules.map((item, idx) => ({
      kind: "module" as const,
      id: item.moduleId,
      item,
      _zone: normalizeZone(item.layoutZone, idx, primaryTileLimit),
      _order: item.sortOrder ?? idx + 1,
    })),
    ...customTiles.map((item, idx) => ({
      kind: "custom" as const,
      id: item.id,
      item,
      _zone: normalizeZone(item.layoutZone, modules.length + idx, primaryTileLimit),
      _order: item.sortOrder ?? modules.length + idx + 1,
    })),
  ];

  return withOrder
    .sort((a, b) => {
      if (a._zone !== b._zone) return a._zone === "primary" ? -1 : 1;
      if (a._order !== b._order) return a._order - b._order;
      return a.id.localeCompare(b.id);
    })
    .map(({ _zone, _order, ...rest }) => rest);
}

export function normalizePortalLayout(
  modules: PortalModuleConfig[],
  customTiles: CustomPortalTile[],
  primaryTileLimit: number
): { modules: PortalModuleConfig[]; customTiles: CustomPortalTile[] } {
  const effectiveLimit = Math.max(1, primaryTileLimit || DEFAULT_PRIMARY_TILE_LIMIT);
  const combined = combineAndSort(modules, customTiles, effectiveLimit);

  const primary: CombinedTile[] = [];
  const compact: CombinedTile[] = [];

  for (const tile of combined) {
    const layoutZone = tile.item.layoutZone ?? "primary";
    if (layoutZone === "compact") compact.push(tile);
    else primary.push(tile);
  }

  if (primary.length > effectiveLimit) {
    compact.unshift(...primary.splice(effectiveLimit));
  }

  const ordered = [...primary, ...compact];
  const nextModules = new Map<string, PortalModuleConfig>();
  const nextCustomTiles = new Map<string, CustomPortalTile>();
  let primaryOrder = 1;
  let compactOrder = 1;

  for (const tile of ordered) {
    const layoutZone: PortalTileLayoutZone = primary.includes(tile) ? "primary" : "compact";
    const sortOrder = layoutZone === "primary" ? primaryOrder++ : compactOrder++;
    if (tile.kind === "module") {
      nextModules.set(tile.id, {
        ...tile.item,
        layoutZone,
        sortOrder,
      });
    } else {
      nextCustomTiles.set(tile.id, {
        ...tile.item,
        layoutZone,
        sortOrder,
      });
    }
  }

  return {
    modules: modules.map((m) => nextModules.get(m.moduleId) ?? { ...m }),
    customTiles: customTiles.map((t) => nextCustomTiles.get(t.id) ?? { ...t }),
  };
}

export function toArrangeTiles(
  modules: PortalModuleConfig[],
  customTiles: CustomPortalTile[],
  primaryTileLimit: number
): ArrangeTile[] {
  const normalized = normalizePortalLayout(modules, customTiles, primaryTileLimit);
  return [
    ...normalized.modules.map((module) => ({
      id: `module:${module.moduleId}`,
      label: module.tileLabel || module.name,
      enabled: module.enabled,
      layoutZone: module.layoutZone ?? "compact",
      sortOrder: module.sortOrder ?? 1,
    })),
    ...normalized.customTiles.map((tile) => ({
      id: `custom:${tile.id}`,
      label: tile.title,
      enabled: tile.enabled,
      layoutZone: tile.layoutZone ?? "compact",
      sortOrder: tile.sortOrder ?? 1,
    })),
  ].sort((a, b) => {
    if (a.layoutZone !== b.layoutZone) return a.layoutZone === "primary" ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label);
  });
}

export function applyArrangeTiles(
  arrangeTiles: ArrangeTile[],
  modules: PortalModuleConfig[],
  customTiles: CustomPortalTile[],
  primaryTileLimit: number
): { modules: PortalModuleConfig[]; customTiles: CustomPortalTile[] } {
  const sorted = [...arrangeTiles].sort((a, b) => {
    if (a.layoutZone !== b.layoutZone) return a.layoutZone === "primary" ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label);
  });

  const modulePatch = new Map<string, Pick<PortalModuleConfig, "layoutZone" | "sortOrder">>();
  const customPatch = new Map<string, Pick<CustomPortalTile, "layoutZone" | "sortOrder">>();
  let primaryOrder = 1;
  let compactOrder = 1;
  const primary: ArrangeTile[] = [];
  const compact: ArrangeTile[] = [];

  for (const tile of sorted) {
    if (tile.layoutZone === "primary") primary.push(tile);
    else compact.push(tile);
  }
  if (primary.length > primaryTileLimit) {
    compact.unshift(...primary.splice(primaryTileLimit));
  }

  for (const tile of [...primary, ...compact]) {
    const zone: PortalTileLayoutZone = primary.includes(tile) ? "primary" : "compact";
    const nextOrder = zone === "primary" ? primaryOrder++ : compactOrder++;
    if (tile.id.startsWith("module:")) {
      modulePatch.set(tile.id.slice(7), { layoutZone: zone, sortOrder: nextOrder });
    } else if (tile.id.startsWith("custom:")) {
      customPatch.set(tile.id.slice(7), { layoutZone: zone, sortOrder: nextOrder });
    }
  }

  return normalizePortalLayout(
    modules.map((m) => ({ ...m, ...(modulePatch.get(m.moduleId) ?? {}) })),
    customTiles.map((t) => ({ ...t, ...(customPatch.get(t.id) ?? {}) })),
    primaryTileLimit
  );
}
