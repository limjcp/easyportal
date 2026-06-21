import { useEffect, useRef, useState } from "react";
import type { AdminTableColumn } from "../../admin/components/AdminPanelTable";
import type { CompanyBuilding } from "../../resident/data/types";

function TealStat({ count, label }: { count: number; label: string }) {
  return (
    <span className="mb-1 block">
      <span className="inline-block rounded bg-[#5bc0de] px-1.5 py-0.5 text-xs font-medium text-white">
        {count}
      </span>{" "}
      {label}
    </span>
  );
}

function BuildingActions({
  building,
  onView,
  onCopy,
  onArchive,
}: {
  building: CompanyBuilding;
  onView: (b: CompanyBuilding) => void;
  onCopy?: (b: CompanyBuilding) => void;
  onArchive?: (b: CompanyBuilding) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex text-center" style={{ width: 80 }}>
      <button
        type="button"
        onClick={() => onView(building)}
        className="rounded-l bg-[#5cb85c] px-2.5 py-1 text-xs text-white hover:bg-[#449d44]"
      >
        View
      </button>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-r border-l border-[#4cae4c] bg-[#5cb85c] px-1.5 py-1 text-xs text-white hover:bg-[#449d44]"
        aria-expanded={open}
        aria-label="More options"
      >
        ▾
      </button>
      {open && (
        <ul className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded border border-slate-200 bg-white py-1 text-left text-sm shadow-lg">
          <li>
            <button
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-slate-50"
              onClick={() => {
                setOpen(false);
                onArchive?.(building);
              }}
            >
              Archive
            </button>
          </li>
          <li>
            <button
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-slate-50"
              onClick={() => {
                setOpen(false);
                onCopy?.(building);
              }}
            >
              Copy Property
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

function ArchivedBuildingActions({
  building,
  onRestore,
}: {
  building: CompanyBuilding;
  onRestore?: (b: CompanyBuilding) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onRestore?.(building)}
      className="rounded bg-[#3476ef] px-2.5 py-1 text-xs text-white hover:bg-[#2d68cf]"
    >
      Restore
    </button>
  );
}

type BuildingColumnsOptions = {
  mode?: "active" | "archived";
  onView: (b: CompanyBuilding) => void;
  onCopy?: (b: CompanyBuilding) => void;
  onArchive?: (b: CompanyBuilding) => void;
  onRestore?: (b: CompanyBuilding) => void;
};

export function getBuildingColumns(
  onViewOrOptions: ((b: CompanyBuilding) => void) | BuildingColumnsOptions,
  onCopyLegacy?: (b: CompanyBuilding) => void,
  onArchiveLegacy?: (b: CompanyBuilding) => void
): AdminTableColumn<CompanyBuilding>[] {
  const options: BuildingColumnsOptions =
    typeof onViewOrOptions === "function"
      ? { mode: "active", onView: onViewOrOptions, onCopy: onCopyLegacy, onArchive: onArchiveLegacy }
      : onViewOrOptions;

  const { mode = "active", onView, onCopy: copyHandler, onArchive, onRestore } = options;
  const isArchived = mode === "archived";

  return [
    {
      key: "image",
      header: "",
      className: "text-center w-28",
      render: (b) =>
        isArchived ? (
          <img src={b.imageUrl} alt="" className="mx-auto h-16 w-24 border border-slate-300 object-cover" />
        ) : (
          <button type="button" onClick={() => onView(b)} className="inline-block">
            <img
              src={b.imageUrl}
              alt=""
              className="h-16 w-24 border border-slate-300 object-cover"
            />
          </button>
        ),
    },
    {
      key: "condo",
      header: "Condo",
      sortable: true,
      sortValue: (b) => b.code,
      render: (b) => (
        <p className="pl-1 text-sm">
          <strong>{b.code}</strong>
          <br />
          {b.condoLine ?? b.name}
          <br />
          {b.cityProvincePostal ?? b.address}
        </p>
      ),
    },
    {
      key: "admins",
      header: "Admins",
      className: "align-top",
      render: (b) => (
        <span className="text-sm text-slate-800">{b.admins ?? "—"}</span>
      ),
      hideBelow: "md",
    },
    {
      key: "setup",
      header: "Setup",
      className: "text-left align-top",
      render: (b) => (
        <div className="text-sm">
          <TealStat count={b.unitsCount ?? 0} label="Units" />
          <TealStat count={b.adminsCount ?? 0} label="Admins" />
          <TealStat count={b.usersCount ?? 0} label="Users" />
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-center",
      render: (b) =>
        isArchived ? (
          <ArchivedBuildingActions building={b} onRestore={onRestore} />
        ) : (
          <BuildingActions building={b} onView={onView} onCopy={copyHandler} onArchive={onArchive} />
        ),
    },
  ];
}
