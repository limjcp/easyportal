import { useMemo, useState, type DragEvent } from "react";
import { FaGripLines, FaPen, FaCheck } from "react-icons/fa";
import type { ArrangeTile } from "../../resident/data/portalTileLayout";
import type { PortalTileLayoutZone } from "../../resident/data/types";

type PortalTileArrangeEditorProps = {
  tiles: ArrangeTile[];
  primaryTileLimit: number;
  onChange: (tiles: ArrangeTile[]) => void;
};

function normalizeArrangement(tiles: ArrangeTile[], primaryTileLimit: number): ArrangeTile[] {
  const primary = tiles
    .filter((t) => t.layoutZone === "primary")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const compact = tiles
    .filter((t) => t.layoutZone === "compact")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (primary.length > primaryTileLimit) {
    compact.unshift(...primary.splice(primaryTileLimit));
  }

  return [
    ...primary.map((tile, idx) => ({ ...tile, layoutZone: "primary" as const, sortOrder: idx + 1 })),
    ...compact.map((tile, idx) => ({ ...tile, layoutZone: "compact" as const, sortOrder: idx + 1 })),
  ];
}

function moveTile(
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

  return normalizeArrangement([...sourcePrimary, ...sourceCompact], Math.max(1, primaryTileLimit));
}

type ZoneListProps = {
  zone: PortalTileLayoutZone;
  title: string;
  description: string;
  items: ArrangeTile[];
  isEditMode: boolean;
  isDragging: boolean;
  draggedId: string | null;
  hoverZone: PortalTileLayoutZone | null;
  hoverIndex: number | null;
  onHandleDragStart: (e: DragEvent<HTMLButtonElement>, id: string) => void;
  onDragEnd: () => void;
  onSlotDragOver: (zone: PortalTileLayoutZone, index: number) => void;
  onDropTo: (zone: PortalTileLayoutZone, index: number, droppedId?: string) => void;
};

function ZoneList({
  zone,
  title,
  description,
  items,
  isEditMode,
  isDragging,
  draggedId,
  hoverZone,
  hoverIndex,
  onHandleDragStart,
  onDragEnd,
  onSlotDragOver,
  onDropTo,
}: ZoneListProps) {
  return (
    <div
      className={`rounded border p-3 transition ${
        isDragging && hoverZone === zone ? "border-[#3476ef] bg-[#eef4ff]" : "border-slate-200 bg-slate-50"
      }`}
    >
      <h5 className="text-sm font-semibold text-slate-700">{title}</h5>
      <p className="mb-3 text-xs text-slate-500">{description}</p>

      <div
        className={`space-y-2 rounded border border-dashed bg-white p-2 ${
          isDragging && hoverZone === zone ? "border-[#3476ef]" : "border-slate-300"
        }`}
        onDragOver={(e) => {
          if (!isEditMode) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          onSlotDragOver(zone, items.length);
        }}
        onDrop={(e) => {
          if (!isEditMode) return;
          e.preventDefault();
          e.stopPropagation();
          const droppedId = e.dataTransfer.getData("text/plain");
          onDropTo(zone, items.length, droppedId || undefined);
        }}
      >
        {!isEditMode && (
          <p className="py-2 text-center text-xs text-slate-400">
            Click <strong>Edit Arrangement</strong> to enable drag and drop.
          </p>
        )}
        {items.length === 0 && (
          <p className="py-4 text-center text-xs text-slate-400">
            {isEditMode ? "Drop tiles here" : "No tiles in this zone"}
          </p>
        )}
        {items.map((tile, index) => (
          <div key={tile.id}>
            {isEditMode && hoverZone === zone && hoverIndex === index && (
              <div className="mb-2 h-1 rounded bg-[#3476ef]" />
            )}
            <div
              className={`rounded border px-3 py-2 text-sm transition ${
                draggedId === tile.id
                  ? "border-[#3476ef] bg-[#e8f0ff] opacity-75"
                  : isEditMode
                    ? "border-slate-200 bg-white hover:border-slate-300"
                    : "border-slate-200/80 bg-slate-50/90"
              }`}
              onDragOver={(e) => {
                if (!isEditMode) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                onSlotDragOver(zone, index);
              }}
              onDrop={(e) => {
                if (!isEditMode) return;
                e.preventDefault();
                e.stopPropagation();
                const droppedId = e.dataTransfer.getData("text/plain");
                onDropTo(zone, index, droppedId || undefined);
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    draggable={isEditMode}
                    onDragStart={(e) => onHandleDragStart(e, tile.id)}
                    onDragEnd={onDragEnd}
                    disabled={!isEditMode}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded border text-slate-500 ${
                      isEditMode
                        ? "cursor-grab border-slate-300 bg-white hover:bg-slate-100 active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-[#3476ef]"
                        : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
                    }`}
                    title={isEditMode ? "Drag to reorder" : "Enable edit mode to drag"}
                  >
                    <FaGripLines className="text-sm" />
                  </button>
                  <span className="truncate font-medium text-slate-700">{tile.label}</span>
                  {draggedId === tile.id && (
                    <span className="rounded bg-[#3476ef] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Dragging
                    </span>
                  )}
                </div>
                <span className={`text-xs ${tile.enabled ? "text-emerald-600" : "text-slate-400"}`}>
                  {tile.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isEditMode && hoverZone === zone && hoverIndex === items.length && (
          <div className="h-1 rounded bg-[#3476ef]" />
        )}
      </div>
    </div>
  );
}

export function PortalTileArrangeEditor({
  tiles,
  primaryTileLimit,
  onChange,
}: PortalTileArrangeEditorProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoverZone, setHoverZone] = useState<PortalTileLayoutZone | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const normalizedTiles = useMemo(
    () => normalizeArrangement(tiles, Math.max(1, primaryTileLimit)),
    [tiles, primaryTileLimit]
  );
  const primaryTiles = normalizedTiles.filter((tile) => tile.layoutZone === "primary");
  const compactTiles = normalizedTiles.filter((tile) => tile.layoutZone === "compact");

  const resetDragState = () => {
    setDraggedId(null);
    setIsDragging(false);
    setHoverZone(null);
    setHoverIndex(null);
  };

  const handleHandleDragStart = (e: DragEvent<HTMLButtonElement>, id: string) => {
    if (!isEditMode) {
      e.preventDefault();
      return;
    }
    setDraggedId(id);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleSlotDragOver = (zone: PortalTileLayoutZone, index: number) => {
    if (!isEditMode || !isDragging) return;
    setHoverZone(zone);
    setHoverIndex(index);
  };

  const handleDropTo = (zone: PortalTileLayoutZone, index: number, droppedId?: string) => {
    if (!isEditMode) return;
    const activeDragId = droppedId ?? draggedId;
    if (!activeDragId) {
      resetDragState();
      return;
    }
    const updated = moveTile(normalizedTiles, activeDragId, zone, index, primaryTileLimit);
    onChange(updated);
    resetDragState();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-sm text-slate-600">
          {isEditMode
            ? "Edit mode is ON. Drag tiles using the handle and drop into highlighted positions."
            : "Edit mode is OFF. Turn it on to reorder tiles."}
        </p>
        <button
          type="button"
          onClick={() => {
            setIsEditMode((prev) => {
              const next = !prev;
              if (!next) resetDragState();
              return next;
            });
          }}
          className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-semibold ${
            isEditMode
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-[#3476ef] text-white hover:bg-[#2c67d1]"
          }`}
        >
          {isEditMode ? <FaCheck /> : <FaPen />}
          {isEditMode ? "Done" : "Edit Arrangement"}
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
      <ZoneList
        zone="primary"
        title="Primary Tiles (Top 2 Rows)"
        description="Standard-size tiles. Overflow is automatically pushed down."
        items={primaryTiles}
        isEditMode={isEditMode}
        isDragging={isDragging}
        draggedId={draggedId}
        hoverZone={hoverZone}
        hoverIndex={hoverIndex}
        onHandleDragStart={handleHandleDragStart}
        onDragEnd={resetDragState}
        onSlotDragOver={handleSlotDragOver}
        onDropTo={handleDropTo}
      />
      <ZoneList
        zone="compact"
        title="Compact Tiles"
        description="Smaller tiles rendered below the first two rows."
        items={compactTiles}
        isEditMode={isEditMode}
        isDragging={isDragging}
        draggedId={draggedId}
        hoverZone={hoverZone}
        hoverIndex={hoverIndex}
        onHandleDragStart={handleHandleDragStart}
        onDragEnd={resetDragState}
        onSlotDragOver={handleSlotDragOver}
        onDropTo={handleDropTo}
      />
      </div>
    </div>
  );
}
