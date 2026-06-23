import { useCallback, useEffect, useState } from "react";
import { FaDoorOpen, FaLevelUpAlt } from "react-icons/fa";
import { AdminFormPanel, InfoBanner, StepCard } from "../../components/AdminFormPanel";
import { adminRepository } from "../../data/adminRepository";
import { ActionButton } from "../../../shared/ActionButton";
import { CrudPanel } from "../../../shared/CrudPanel";
import { ConfirmModal } from "../../../shared/ConfirmModal";
import { FormAlert } from "../../../shared/FormAlert";
import { useAsyncAction } from "../../../shared/useAsyncAction";
import type { BuildingAmenityResource, BuildingAmenityResourceType } from "../../../resident/data/types";

type AmenitiesTabProps = {
  refreshKey: number;
  onRefresh: () => void;
};

type ResourceSectionProps = {
  resourceType: BuildingAmenityResourceType;
  title: string;
  icon: React.ReactNode;
  resources: BuildingAmenityResource[];
  refreshKey: number;
  onRefresh: () => void;
};

function ResourceSection({
  resourceType,
  title,
  icon,
  resources,
  refreshKey,
  onRefresh,
}: ResourceSectionProps) {
  const [name, setName] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const activeResources = resources.filter((r) => r.isActive);

  const resetForm = () => {
    setName("");
    setLocationLabel("");
  };

  const { run: handleAdd, loading: adding, error: addError } = useAsyncAction(
    useCallback(async () => {
      if (!name.trim()) throw new Error("Name is required.");
      await adminRepository.addBuildingAmenityResource({
        resourceType,
        name: name.trim(),
        locationLabel: locationLabel.trim(),
      });
      resetForm();
      onRefresh();
    }, [name, locationLabel, resourceType, onRefresh]),
    { successMessage: `${title} added.` }
  );

  const { run: handleSaveEdit, loading: saving, error: editError } = useAsyncAction(
    useCallback(async () => {
      if (!editingId) return;
      if (!editName.trim()) throw new Error("Name is required.");
      await adminRepository.updateBuildingAmenityResource(editingId, {
        name: editName.trim(),
        locationLabel: editLocation.trim(),
      });
      setEditingId(null);
      onRefresh();
    }, [editName, editLocation, editingId, onRefresh]),
    { successMessage: "Changes saved." }
  );

  const { run: handleDeactivate, loading: deactivating } = useAsyncAction(
    useCallback(async () => {
      if (!deactivateId) return;
      await adminRepository.deactivateBuildingAmenityResource(deactivateId);
      setDeactivateId(null);
      onRefresh();
    }, [deactivateId, onRefresh]),
    { successMessage: "Resource deactivated." }
  );

  useEffect(() => {
    setEditingId(null);
  }, [refreshKey]);

  const startEdit = (resource: BuildingAmenityResource) => {
    setEditingId(resource.id);
    setEditName(resource.name);
    setEditLocation(resource.locationLabel);
  };

  return (
    <div className="space-y-4">
      <InfoBanner icon={icon} title={title} subtitle={`Define bookable ${title.toLowerCase()} for residents.`} />

      <div className="mx-auto grid w-full gap-4 sm:grid-cols-3">
        <StepCard step={1} text={`Add each ${title.toLowerCase().slice(0, -1)} by name.`} />
        <StepCard step={2} text="Optionally include a location label (floor, wing, etc.)." />
        <StepCard step={3} text="Residents choose a resource when submitting bookings." />
      </div>

      <AdminFormPanel title={`Add ${title.slice(0, -1)}:`} headerColor="primary">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
              placeholder={resourceType === "party_room" ? "Party Room A" : "Freight Elevator"}
            />
          </label>
          <label className="block text-sm">
            Location (optional)
            <input
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
              placeholder="Floor 2, East wing"
            />
          </label>
        </div>
        {addError ? <FormAlert message={addError} className="mt-3" /> : null}
        <ActionButton
          label={`Add ${title.slice(0, -1)}`}
          loadingLabel="Adding…"
          loading={adding}
          variant="success"
          className="mt-4"
          onClick={() => void handleAdd()}
        />
      </AdminFormPanel>

      <AdminFormPanel title={`Current ${title}:`} headerColor="primary">
        {activeResources.length === 0 ? (
          <p className="py-8 text-center text-slate-500">No {title.toLowerCase()} defined yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="px-4 py-2 text-left font-medium">Location</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeResources.map((resource) =>
                editingId === resource.id ? (
                  <tr key={resource.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full rounded border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          label="Save"
                          loadingLabel="Saving…"
                          loading={saving}
                          className="px-2 py-1 text-xs"
                          onClick={() => void handleSaveEdit()}
                        />
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                      {editError ? <FormAlert message={editError} className="mt-2" /> : null}
                    </td>
                  </tr>
                ) : (
                  <tr key={resource.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium">{resource.name}</td>
                    <td className="px-4 py-3 text-slate-600">{resource.locationLabel || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(resource)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeactivateId(resource.id)}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </AdminFormPanel>

      <ConfirmModal
        open={deactivateId != null}
        title="Deactivate resource?"
        message="Residents will no longer be able to book this resource. Existing bookings will keep the resource name."
        confirmLabel="Deactivate"
        loading={deactivating}
        variant="danger"
        onConfirm={() => void handleDeactivate()}
        onClose={() => setDeactivateId(null)}
      />
    </div>
  );
}

export function AmenitiesTab({ refreshKey, onRefresh }: AmenitiesTabProps) {
  const [partyRooms, setPartyRooms] = useState<BuildingAmenityResource[]>([]);
  const [elevators, setElevators] = useState<BuildingAmenityResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      adminRepository.getBuildingAmenityResources("party_room"),
      adminRepository.getBuildingAmenityResources("elevator"),
    ])
      .then(([rooms, lifts]) => {
        if (!cancelled) {
          setPartyRooms(rooms);
          setElevators(lifts);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <CrudPanel className="space-y-8" loading={loading}>
      <ResourceSection
        resourceType="party_room"
        title="Party Rooms"
        icon={<FaDoorOpen />}
        resources={partyRooms}
        refreshKey={refreshKey}
        onRefresh={onRefresh}
      />
      <ResourceSection
        resourceType="elevator"
        title="Elevators"
        icon={<FaLevelUpAlt />}
        resources={elevators}
        refreshKey={refreshKey}
        onRefresh={onRefresh}
      />
    </CrudPanel>
  );
}
