import { useCallback, useEffect, useState } from "react";
import { FaLock } from "react-icons/fa";
import { AdminFormPanel, InfoBanner, StepCard } from "../../components/AdminFormPanel";
import { adminRepository } from "../../data/adminRepository";
import { ActionButton } from "../../../shared/ActionButton";
import { CrudPanel } from "../../../shared/CrudPanel";
import { FormAlert } from "../../../shared/FormAlert";
import { useAsyncAction } from "../../../shared/useAsyncAction";
import type { AddUnitRangeType, BuildingLockerGroup } from "../../../resident/data/types";

type LockersTabProps = {
  refreshKey: number;
  onRefresh: () => void;
};

export function LockersTab({ refreshKey, onRefresh }: LockersTabProps) {
  const [groups, setGroups] = useState<BuildingLockerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [floor, setFloor] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [addType, setAddType] = useState<AddUnitRangeType>("all");

  const { run: handleAdd, loading: adding, error } = useAsyncAction(
    useCallback(async () => {
      if (!floor.trim() || !start.trim() || !end.trim()) {
        throw new Error("Floor/Area, Start, and End are required.");
      }
      await adminRepository.addBuildingLockers({ floorArea: floor.trim(), start, end, addType });
      setFloor("");
      setStart("");
      setEnd("");
      onRefresh();
    }, [floor, start, end, addType, onRefresh]),
    { successMessage: "Lockers added." }
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminRepository
      .getBuildingLockers()
      .then((data) => {
        if (!cancelled) setGroups(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <CrudPanel className="space-y-4" loading={loading}>
      <InfoBanner
        icon={<FaLock />}
        title="Lockers Definition"
        subtitle="Define your lockers here."
      />

      <div className="mx-auto grid w-full gap-4 sm:grid-cols-3">
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
        {error ? <FormAlert message={error} className="mt-3" /> : null}
        <ActionButton
          label="Add Lockers"
          loadingLabel="Adding…"
          loading={adding}
          variant="success"
          className="mt-4"
          onClick={() => void handleAdd()}
        />
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
    </CrudPanel>
  );
}
