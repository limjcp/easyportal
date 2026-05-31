import { useEffect, useMemo, useState, type DragEvent } from "react";
import type { IconType } from "react-icons";
import {
  FaCalendarAlt,
  FaCertificate,
  FaCommentDots,
  FaComments,
  FaExclamationTriangle,
  FaFile,
  FaFileAlt,
  FaFireExtinguisher,
  FaImages,
  FaLink,
  FaNewspaper,
  FaPoll,
  FaQuestionCircle,
  FaUserTie,
  FaVoteYea,
  FaWrench,
} from "react-icons/fa";
import { usePortalConfig } from "../context/PortalConfigContext";
import { residentRepo } from "../data/mockRepository";
import {
  mergeArrangeTiles,
  moveArrangeTile,
  toArrangeTiles,
  type ArrangeTile,
} from "../data/portalTileLayout";
import { DETAIL_TILE_ICONS, isDetailTileVisible } from "../data/residentDetailConfig";
import type { PortalTileLayoutZone } from "../data/types";
import { tileLabelToRoute } from "../navigation";
import type { ResidentRoute } from "../navigation";

const TILE_ICONS: Record<string, IconType> = {
  "News / Notices": FaNewspaper,
  Documents: FaFileAlt,
  "Incident Reports": FaExclamationTriangle,
  "Service Requests": FaWrench,
  Newsletters: FaFile,
  Suggestions: FaCommentDots,
  Events: FaCalendarAlt,
  "Photo Gallery": FaImages,
  "Frequently Asked Questions": FaQuestionCircle,
  "Status Certificates": FaCertificate,
  Polls: FaPoll,
  "Become a Board Member": FaUserTie,
  "Board Elections": FaVoteYea,
  "Fire Safety Plan": FaFireExtinguisher,
  Chat: FaComments,
  ...DETAIL_TILE_ICONS,
};

type TileGridProps = {
  onNavigate: (route: ResidentRoute) => void;
};

export function TileGrid({ onNavigate }: TileGridProps) {
  const { portalModules, portalTileSettings, customPortalTiles, profileFieldOptions } =
    usePortalConfig();
  const opacity = portalTileSettings.portalTileOpacity;
  const [personalLayout, setPersonalLayout] = useState<ArrangeTile[] | null>(null);
  const [displayTiles, setDisplayTiles] = useState<ArrangeTile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoverZone, setHoverZone] = useState<PortalTileLayoutZone | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const visibleModules = useMemo(
    () =>
      portalModules.filter(
        (module) =>
          module.enabled &&
          module.tileLabel &&
          tileLabelToRoute(module.tileLabel) &&
          isDetailTileVisible(module, profileFieldOptions)
      ),
    [portalModules, profileFieldOptions]
  );
  const visibleCustomTiles = useMemo(
    () => customPortalTiles.filter((tile) => tile.enabled),
    [customPortalTiles]
  );
  const baseArrangeTiles = useMemo(
    () =>
      toArrangeTiles(
        visibleModules,
        visibleCustomTiles,
        portalTileSettings.primaryTileLimit
      ),
    [visibleModules, visibleCustomTiles, portalTileSettings.primaryTileLimit]
  );
  const mergedArrangeTiles = useMemo(
    () =>
      mergeArrangeTiles(
        baseArrangeTiles,
        personalLayout,
        portalTileSettings.primaryTileLimit
      ),
    [baseArrangeTiles, personalLayout, portalTileSettings.primaryTileLimit]
  );
  const customTileMap = useMemo(
    () => new Map(customPortalTiles.map((tile) => [tile.id, tile])),
    [customPortalTiles]
  );

  useEffect(() => {
    let cancelled = false;
    residentRepo.getPersonalTileLayout().then((savedLayout) => {
      if (cancelled) return;
      setPersonalLayout(savedLayout);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isDragging) return;
    setDisplayTiles(mergedArrangeTiles);
  }, [mergedArrangeTiles, isDragging]);

  const arranged = displayTiles.length > 0 ? displayTiles : mergedArrangeTiles;
  const primaryTiles = arranged.filter((tile) => tile.layoutZone === "primary");
  const compactTiles = arranged.filter((tile) => tile.layoutZone === "compact");

  const resetDragState = () => {
    setIsDragging(false);
    setDraggedId(null);
    setHoverZone(null);
    setHoverIndex(null);
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, tileId: string) => {
    setDraggedId(tileId);
    setIsDragging(true);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", tileId);
  };

  const handleDragOverSlot = (
    event: DragEvent<HTMLElement>,
    zone: PortalTileLayoutZone,
    index: number
  ) => {
    if (!isDragging) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setHoverZone(zone);
    setHoverIndex(index);
  };

  const persistLayout = async (tiles: ArrangeTile[]) => {
    await residentRepo.savePersonalTileLayout(tiles);
    setPersonalLayout(tiles);
  };

  const handleDrop = (zone: PortalTileLayoutZone, index: number, droppedId?: string) => {
    const activeDragId = droppedId ?? draggedId;
    if (!activeDragId) {
      resetDragState();
      return;
    }

    const nextTiles = moveArrangeTile(
      arranged,
      activeDragId,
      zone,
      index,
      portalTileSettings.primaryTileLimit
    );
    setDisplayTiles(nextTiles);
    resetDragState();
    void persistLayout(nextTiles);
  };

  const handleResetToDefault = async () => {
    await residentRepo.resetPersonalTileLayout();
    setPersonalLayout(null);
    setDisplayTiles(mergeArrangeTiles(baseArrangeTiles, null, portalTileSettings.primaryTileLimit));
    resetDragState();
  };

  const renderTileCard = (
    tile: ArrangeTile,
    compact: boolean,
    zone: PortalTileLayoutZone,
    index: number
  ) => {
    const isModule = tile.id.startsWith("module:");
    const tileKey = tile.id.slice(7);
    const Icon = isModule ? TILE_ICONS[tile.label] ?? FaLink : FaLink;
    const customTile = isModule ? undefined : customTileMap.get(tileKey);

    return (
      <div key={tile.id}>
        {hoverZone === zone && hoverIndex === index && (
          <div className="mb-2 h-1 rounded bg-white/80" />
        )}
        <div
          draggable
          onDragStart={(event) => handleDragStart(event, tile.id)}
          onDragEnd={resetDragState}
          onDragOver={(event) => handleDragOverSlot(event, zone, index)}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const droppedId = event.dataTransfer.getData("text/plain");
            handleDrop(zone, index, droppedId || undefined);
          }}
          onClick={() => {
            if (isDragging) return;
            if (isModule) {
              const route = tileLabelToRoute(tile.label);
              if (route) onNavigate(route);
              return;
            }
            if (customTile?.actionType === "url" && customTile.target) {
              window.open(customTile.target, "_blank");
            } else {
              alert(`Download: ${customTile?.target ?? "file"}`);
            }
          }}
          className={`group flex flex-col items-center justify-center rounded-sm border border-white/10 shadow-lg shadow-black/10 backdrop-blur-[2px] transition duration-200 ${
            compact ? "h-20 gap-2 px-2" : "h-32 gap-4 px-3"
          } cursor-grab hover:-translate-y-0.5 hover:shadow-xl active:cursor-grabbing ${draggedId === tile.id ? "ring-2 ring-white/70 opacity-75" : ""}`}
          style={{ backgroundColor: `rgba(31, 38, 49, ${opacity})` }}
        >
          <div className="flex w-full items-center justify-end">
            {draggedId === tile.id && (
              <span className="rounded bg-[#3476ef] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Dragging
              </span>
            )}
          </div>
          <Icon className={`${compact ? "text-xl" : "text-3xl"} text-white transition group-hover:scale-105`} />
          <span
            className={`${compact ? "text-xs" : "text-sm"} text-center font-medium tracking-[0.01em] text-white/95`}
          >
            {tile.label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${
          isDragging && hoverZone === "primary" ? "rounded-sm ring-1 ring-white/70" : ""
        }`}
        onDragOver={(event) => handleDragOverSlot(event, "primary", primaryTiles.length)}
        onDrop={(event) => {
          event.preventDefault();
          const droppedId = event.dataTransfer.getData("text/plain");
          handleDrop("primary", primaryTiles.length, droppedId || undefined);
        }}
      >
        {primaryTiles.map((tile, index) => renderTileCard(tile, false, "primary", index))}
        {hoverZone === "primary" && hoverIndex === primaryTiles.length && (
          <div className="h-1 rounded bg-white/80" />
        )}
      </div>

      {compactTiles.length > 0 && (
        <div
          className={`rounded-sm border p-3 ${
            isDragging && hoverZone === "compact"
              ? "border-white/70 bg-black/30"
              : "border-white/10 bg-black/15"
          }`}
          onDragOver={(event) => handleDragOverSlot(event, "compact", compactTiles.length)}
          onDrop={(event) => {
            event.preventDefault();
            const droppedId = event.dataTransfer.getData("text/plain");
            handleDrop("compact", compactTiles.length, droppedId || undefined);
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-white/80">More</h4>
            <button
              type="button"
              onClick={() => void handleResetToDefault()}
              className="rounded border border-white/30 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/10"
            >
              Reset
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {compactTiles.map((tile, index) => renderTileCard(tile, true, "compact", index))}
          </div>
          {hoverZone === "compact" && hoverIndex === compactTiles.length && (
            <div className="mt-2 h-1 rounded bg-white/80" />
          )}
        </div>
      )}
    </div>
  );
}
