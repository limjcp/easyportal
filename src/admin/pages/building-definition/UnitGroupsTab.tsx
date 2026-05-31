import { useEffect, useState } from "react";
import { FaBuilding } from "react-icons/fa";
import { Modal } from "../../../shared/Modal";
import { AdminFormPanel, InfoBanner } from "../../components/AdminFormPanel";
import { adminRepository } from "../../data/adminRepository";
import type { BuildingUnitGroup, BuildingUnitGroupDefinition } from "../../../resident/data/types";

type UnitGroupsTabProps = {
  refreshKey: number;
  onRefresh: () => void;
};

export function UnitGroupsTab({ refreshKey, onRefresh }: UnitGroupsTabProps) {
  const [groups, setGroups] = useState<BuildingUnitGroupDefinition[]>([]);
  const [units, setUnits] = useState<BuildingUnitGroup[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([adminRepository.getBuildingUnitGroups(), adminRepository.getBuildingUnits()]).then(
      ([g, u]) => {
        setGroups(g);
        setUnits(u);
      }
    );
  }, [refreshKey]);

  const allUnits = units.flatMap((g) => g.units.map((u) => ({ floor: g.floorArea, unit: u })));

  const handleCreate = async () => {
    if (!name.trim()) {
      alert("Group name is required.");
      return;
    }
    await adminRepository.createBuildingUnitGroup(name.trim(), selectedUnits);
    setShowModal(false);
    setName("");
    setSelectedUnits([]);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <InfoBanner
        icon={<FaBuilding />}
        title="Building Unit Groups"
        subtitle="Create your own custom groups of units for use in the admin portal."
      />

      {groups.length === 0 ? (
        <div className="mx-auto max-w-lg rounded border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-700">Your Condo Currently Has no Unit Groups!</p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-4 rounded bg-[#89c64c] px-4 py-2 text-sm text-white"
          >
            + Add Unit Group
          </button>
        </div>
      ) : (
        <AdminFormPanel title="Unit Groups">
          <ul className="space-y-2">
            {groups.map((g) => (
              <li key={g.id} className="rounded border border-slate-200 px-4 py-2 text-sm">
                <strong>{g.name}</strong> — {g.unitIds.join(", ")}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setShowModal(true)} className="mt-4 rounded bg-[#89c64c] px-4 py-2 text-sm text-white">
            + Add Unit Group
          </button>
        </AdminFormPanel>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Unit Group"
        footer={
          <>
            <button type="button" onClick={() => setShowModal(false)} className="rounded border px-4 py-2 text-sm">Cancel</button>
            <button type="button" onClick={handleCreate} className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white">Create</button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm">
            Group Name
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5" />
          </label>
          <div>
            <p className="mb-2 text-sm font-medium">Select Units</p>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded border border-slate-200 p-2">
              {allUnits.map(({ floor, unit }) => {
                const id = `${floor}:${unit}`;
                return (
                  <label key={id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedUnits.includes(id)}
                      onChange={(e) =>
                        setSelectedUnits(
                          e.target.checked ? [...selectedUnits, id] : selectedUnits.filter((x) => x !== id)
                        )
                      }
                    />
                    {floor} — {unit}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
