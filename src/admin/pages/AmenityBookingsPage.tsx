import { useEffect, useMemo, useState } from "react";
import { AdminPanelTable, AdminTabs } from "../components/AdminPanelTable";
import { AdminPageActions } from "../components/AdminPageActions";
import { adminRepository } from "../data/adminRepository";
import { AmenityBookingDetailModal } from "../modals/AmenityBookingDetailModal";
import type { AdminRoute } from "../navigation";
import type { AmenityBooking, BuildingAmenitySettings } from "../../resident/data/types";

type AmenityBookingsPageProps = {
  route: AdminRoute & { page: "amenity-bookings" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

const TABS = [
  { id: "current" as const, label: "Current" },
  { id: "past" as const, label: "Past" },
  { id: "cancelled" as const, label: "Cancelled" },
  { id: "settings" as const, label: "Settings" },
];

function labelType(type: AmenityBooking["bookingType"]) {
  return type === "elevator" ? "Elevator" : "Party Room";
}

function labelStatus(status: AmenityBooking["status"]) {
  switch (status) {
    case "pending":
      return "Pending";
    case "approvedAwaitingPayment":
      return "Awaiting Payment";
    case "confirmed":
      return "Confirmed";
    case "declined":
      return "Declined";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function AmenityBookingsPage({ route, onNavigate, refreshKey, onRefresh }: AmenityBookingsPageProps) {
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [settings, setSettings] = useState<BuildingAmenitySettings>({
    partyRoomFee: "",
    elevatorInstructions: "",
    partyRoomInstructions: "",
  });
  const [draftSettings, setDraftSettings] = useState(settings);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  useEffect(() => {
    adminRepository.getBuildingAmenitySettings().then(setSettings);
  }, [refreshKey]);

  useEffect(() => {
    if (route.tab === "settings") {
      adminRepository.getBuildingAmenitySettings().then((loaded) => {
        setSettings(loaded);
        setDraftSettings(loaded);
      });
      return;
    }
    adminRepository.getAmenityBookings(route.tab).then(setBookings);
  }, [route.tab, refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (row) =>
        row.residentName.toLowerCase().includes(q) ||
        row.unit.toLowerCase().includes(q) ||
        labelType(row.bookingType).toLowerCase().includes(q)
    );
  }, [bookings, search]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      const saved = await adminRepository.saveBuildingAmenitySettings(draftSettings);
      setSettings(saved);
      setDraftSettings(saved);
      setSettingsMessage("Settings saved.");
      onRefresh();
    } catch (err) {
      setSettingsMessage(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageActions route={route} onNavigate={onNavigate} />

      <AdminTabs
        tabs={TABS}
        activeTab={route.tab}
        onChange={(tabId) =>
          onNavigate({
            page: "amenity-bookings",
            tab: tabId as "current" | "past" | "cancelled" | "settings",
          })
        }
      />

      {route.tab === "settings" ? (
        <div className="rounded border border-slate-300 bg-white p-4">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Amenity Booking Settings</h3>
          <div className="grid max-w-2xl gap-4">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Default Party Room Fee</span>
              <input
                value={draftSettings.partyRoomFee}
                onChange={(event) =>
                  setDraftSettings((prev) => ({ ...prev, partyRoomFee: event.target.value }))
                }
                className="w-full rounded border border-slate-300 px-3 py-2"
                placeholder="$150.00"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Elevator Booking Instructions</span>
              <textarea
                value={draftSettings.elevatorInstructions}
                onChange={(event) =>
                  setDraftSettings((prev) => ({ ...prev, elevatorInstructions: event.target.value }))
                }
                rows={4}
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Party Room Booking Instructions</span>
              <textarea
                value={draftSettings.partyRoomInstructions}
                onChange={(event) =>
                  setDraftSettings((prev) => ({ ...prev, partyRoomInstructions: event.target.value }))
                }
                rows={4}
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            {settingsMessage ? <p className="text-sm text-slate-600">{settingsMessage}</p> : null}
            <div>
              <button
                type="button"
                disabled={savingSettings}
                onClick={() => void handleSaveSettings()}
                className="rounded bg-[#7D5DA7] px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      ) : (
        <AdminPanelTable
          title="Amenity Bookings"
          data={filtered}
          search={search}
          onSearchChange={setSearch}
          pageSize={10}
          onPageSizeChange={() => undefined}
          page={1}
          onPageChange={() => undefined}
          columns={[
            { key: "type", header: "Type", render: (row) => labelType(row.bookingType) },
            { key: "unit", header: "Unit", render: (row) => row.unit },
            { key: "resident", header: "Resident", render: (row) => row.residentName },
            {
              key: "date",
              header: "Date",
              render: (row) => `${row.bookingDate} ${row.startTime}–${row.endTime}`,
            },
            { key: "status", header: "Status", render: (row) => labelStatus(row.status) },
            {
              key: "payment",
              header: "Payment",
              render: (row) => row.paymentAmount ?? (row.paymentAt ? "Paid" : "—"),
            },
            {
              key: "actions",
              header: "",
              render: (row) => (
                <button
                  type="button"
                  onClick={() => setDetailId(row.id)}
                  className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                >
                  View
                </button>
              ),
            },
          ]}
          getRowKey={(row) => row.id}
          emptyMessage="No bookings in this tab."
        />
      )}

      <AmenityBookingDetailModal
        bookingId={detailId}
        open={!!detailId}
        onClose={() => setDetailId(null)}
        onUpdated={onRefresh}
        defaultPartyRoomFee={settings.partyRoomFee}
      />
    </div>
  );
}
