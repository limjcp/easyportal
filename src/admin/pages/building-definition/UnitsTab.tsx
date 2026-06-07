import { useEffect, useState } from "react";
import { FaBuilding } from "react-icons/fa";
import { Modal } from "../../../shared/Modal";
import { AdminFormPanel, InfoBanner, StepCard } from "../../components/AdminFormPanel";
import { adminRepository } from "../../data/adminRepository";
import type { AddUnitRangeType, BuildingUnitGroup } from "../../../resident/data/types";

type UnitsTabProps = {
  refreshKey: number;
  onRefresh: () => void;
};

export function UnitsTab({ refreshKey, onRefresh }: UnitsTabProps) {
  const [groups, setGroups] = useState<BuildingUnitGroup[]>([]);
  const [floor, setFloor] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [addType, setAddType] = useState<AddUnitRangeType>("all");
  const [viewUnit, setViewUnit] = useState<{ floor: string; unit: string; occupied: boolean } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    adminRepository
      .getBuildingUnits()
      .then(setGroups)
      .catch((err) => {
        setActionError(err instanceof Error ? err.message : "Failed to load units.");
      });
  }, [refreshKey]);

  const handleAdd = async () => {
    if (!floor.trim() || !start.trim() || !end.trim()) {
      alert("Floor/Area, Start, and End are required.");
      return;
    }
    setAdding(true);
    setActionError(null);
    try {
      const updated = await adminRepository.addBuildingUnits({
        floorArea: floor.trim(),
        start,
        end,
        addType,
      });
      setGroups(updated);
      setFloor("");
      setStart("");
      setEnd("");
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add units.");
    } finally {
      setAdding(false);
    }
  };

  const openUnit = (group: BuildingUnitGroup, unit: string) => {
    const occupied = group.occupiedUnits?.includes(unit) ?? false;
    setViewUnit({ floor: group.floorArea, unit, occupied });
  };

  return (
    <div className="space-y-4">
      <InfoBanner
        icon={<FaBuilding />}
        title="Units Definition"
        subtitle="Define your units here."
      />

      {actionError ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</div>
      ) : null}

      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
        <StepCard step={1} text="Enter the first and last unit for each floor/area, we'll fill in the rest." />
        <StepCard step={2} text="Once added, you can edit or delete any units that need adjustment." />
        <StepCard step={3} text="Continue until all units for your building have been added!" />
      </div>

      <AdminFormPanel title="Add Units:" headerColor="primary">
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="block text-sm">
            Floor/Area
            <input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Floor: 1" className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-center" />
          </label>
          <label className="block text-sm">
            Start
            <input value={start} onChange={(e) => setStart(e.target.value)} placeholder="start" className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-center" />
          </label>
          <label className="block text-sm">
            End
            <input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="end" className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-center" />
          </label>
          <label className="block text-sm">
            Add
            <select value={addType} onChange={(e) => setAddType(e.target.value as AddUnitRangeType)} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5">
              <option value="all">All Units</option>
              <option value="even">Only Even Units</option>
              <option value="odd">Only Odd Units</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={adding}
          className="mt-4 rounded bg-[#89c64c] px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {adding ? "Adding…" : "Add Units"}
        </button>
      </AdminFormPanel>

      <AdminFormPanel
        title="Current Units:"
        icon={<FaBuilding className="text-white" />}
        headerColor="primary"
        toolbar={
          <button type="button" className="rounded border border-white/30 bg-white/10 px-2 py-1 text-xs text-white">
            Export Units
          </button>
        }
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-2 text-center font-medium">Floor/Area</th>
              <th className="px-4 py-2 font-medium">Units</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-center">
                  <span className="rounded bg-[#3476ef] px-2 py-0.5 text-xs font-medium text-white">{g.floorArea}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {g.units.map((u) => {
                      const occupied = g.occupiedUnits?.includes(u) ?? false;
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() => openUnit(g, u)}
                          className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs hover:bg-slate-50"
                          title={occupied ? "Occupied unit" : "Vacant unit"}
                        >
                          {u}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminFormPanel>

      <Modal
        open={!!viewUnit}
        onClose={() => setViewUnit(null)}
        title={`Unit ${viewUnit?.unit}`}
        footer={<button type="button" onClick={() => setViewUnit(null)} className="rounded border px-4 py-2 text-sm">Close</button>}
      >
        {viewUnit && (
          <div className="space-y-2 text-sm">
            <p><strong>Floor/Area:</strong> {viewUnit.floor}</p>
            <p><strong>Unit:</strong> {viewUnit.unit}</p>
            <p><strong>Status:</strong> {viewUnit.occupied ? "Occupied" : "Vacant"}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
