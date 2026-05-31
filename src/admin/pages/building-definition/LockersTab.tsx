import { useEffect, useState } from "react";
import { FaLock } from "react-icons/fa";
import { AdminFormPanel, InfoBanner, StepCard } from "../../components/AdminFormPanel";
import { adminRepository } from "../../data/adminRepository";
import type { AddUnitRangeType, BuildingLockerGroup } from "../../../resident/data/types";

type LockersTabProps = {
  refreshKey: number;
  onRefresh: () => void;
};

export function LockersTab({ refreshKey, onRefresh }: LockersTabProps) {
  const [groups, setGroups] = useState<BuildingLockerGroup[]>([]);
  const [floor, setFloor] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [addType, setAddType] = useState<AddUnitRangeType>("all");

  useEffect(() => {
    adminRepository.getBuildingLockers().then(setGroups);
  }, [refreshKey]);

  const handleAdd = async () => {
    if (!floor.trim() || !start.trim() || !end.trim()) {
      alert("Floor/Area, Start, and End are required.");
      return;
    }
    await adminRepository.addBuildingLockers({ floorArea: floor.trim(), start, end, addType });
    setFloor("");
    setStart("");
    setEnd("");
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <InfoBanner
        icon={<FaLock />}
        title="Lockers Definition"
        subtitle="Define your lockers here."
      />

      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
        <StepCard step={1} text="Enter the first and last locker for each floor/area." />
        <StepCard step={2} text="Once added, you can edit or delete any lockers that need adjustment." />
        <StepCard step={3} text="Continue until all lockers have been added!" />
      </div>

      <AdminFormPanel title="Add Lockers:" headerColor="primary">
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="block text-sm">
            Floor/Area
            <input value={floor} onChange={(e) => setFloor(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-center" />
          </label>
          <label className="block text-sm">
            Start
            <input value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-center" />
          </label>
          <label className="block text-sm">
            End
            <input value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-center" />
          </label>
          <label className="block text-sm">
            Add
            <select value={addType} onChange={(e) => setAddType(e.target.value as AddUnitRangeType)} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5">
              <option value="all">All Lockers</option>
              <option value="even">Only Even</option>
              <option value="odd">Only Odd</option>
            </select>
          </label>
        </div>
        <button type="button" onClick={handleAdd} className="mt-4 rounded bg-[#89c64c] px-4 py-2 text-sm text-white">
          Add Lockers
        </button>
      </AdminFormPanel>

      <AdminFormPanel title="Current Lockers:" headerColor="primary">
        {groups.length === 0 ? (
          <p className="py-8 text-center text-slate-500">No lockers defined yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-2 text-center font-medium">Floor/Area</th>
                <th className="px-4 py-2 font-medium">Lockers</th>
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
                      {g.lockers.map((l) => (
                        <span key={l} className="rounded border border-slate-300 px-2 py-0.5 text-xs">{l}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminFormPanel>
    </div>
  );
}
