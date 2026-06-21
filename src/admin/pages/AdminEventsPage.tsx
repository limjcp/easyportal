import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { OptionsDropdown, StatusBadge } from "../components/AdminBadges";
import { AdminEventCalendar } from "../components/AdminEventCalendar";
import { AdminPanelTable, AdminTabs } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AdminPageActions } from "../components/AdminPageActions";
import { AddEventModal } from "../modals/AddEventModal";
import { EventDetailModal } from "../modals/EventDetailModal";
import type { AdminRoute } from "../navigation";
import type {
  AdminEventStatus,
  AdminEventType,
  CalendarEvent,
} from "../../resident/data/types";

const EVENT_TABS = [
  { id: "calendar" as const, label: "Event Calendar" },
  { id: "once" as const, label: "One-Time Events" },
  { id: "recurring" as const, label: "Recurring Events" },
  { id: "paid" as const, label: "Paid Events" },
];

type AdminEventsPageProps = {
  route: AdminRoute & { page: "events" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

function formatDisplayDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}-${y}`;
}

export function AdminEventsPage({ route, onNavigate, refreshKey, onRefresh }: AdminEventsPageProps) {
  const [items, setItems] = useState<CalendarEvent[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const pendingEventIdRef = useRef<string | null>(null);
  const pendingCreateRef = useRef<Parameters<typeof adminRepository.createEvent>[0] | null>(null);

  const calendarFilter = route.calendarFilter ?? "all";
  const adminOnly = calendarFilter === "admin-only";

  useEffect(() => {
    if (route.tab === "calendar") {
      adminRepository
        .getEvents(adminOnly ? { adminOnly: true } : {})
        .then(setItems);
    } else {
      adminRepository.getEvents({ type: route.tab as AdminEventType }).then(setItems);
    }
    setPage(1);
  }, [route.tab, calendarFilter, refreshKey, adminOnly]);

  const { run: deleteEventRun, error: deleteError } = useAsyncAction(
    useCallback(async () => {
      const id = pendingEventIdRef.current;
      if (!id) return;
      await adminRepository.deleteEvent(id);
      onRefresh();
    }, [onRefresh]),
    { successMessage: "Event deleted." }
  );

  const { run: createEventRun } = useAsyncAction(
    useCallback(async () => {
      const event = pendingCreateRef.current;
      if (!event) return;
      await adminRepository.createEvent(event);
      onRefresh();
    }, [onRefresh]),
    { successMessage: "Event created." }
  );

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== (statusFilter as AdminEventStatus)) {
        return false;
      }
      return true;
    });
  }, [items, statusFilter]);

  const setTab = (tab: typeof route.tab) => {
    onNavigate({
      page: "events",
      tab,
      calendarFilter: tab === "calendar" ? calendarFilter : undefined,
    });
  };

  const listEventType: AdminEventType =
    route.tab === "calendar" ? "once" : (route.tab as AdminEventType);

  return (
    <>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          route.tab !== "calendar" ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded bg-[#7D5DA7] px-3 py-1.5 text-sm text-white hover:opacity-90"
            >
              + Add Event
            </button>
          ) : undefined
        }
      />

      {deleteError ? <FormAlert message={deleteError} className="mb-3" /> : null}

      <AdminTabs
        tabs={EVENT_TABS.map((t) => ({ id: t.id, label: t.label }))}
        activeTab={route.tab}
        onChange={(tab) => setTab(tab as typeof route.tab)}
      />

      {route.tab === "calendar" ? (
        <div className="min-w-0 max-w-full overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 bg-[#3476ef] px-4 py-2 text-sm font-semibold text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FaCalendarAlt />
              Event Calendar
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <AdminEventCalendar
              events={filtered}
              adminOnlyFilter={adminOnly}
              onAdminOnlyFilterChange={(only) =>
                onNavigate({
                  page: "events",
                  tab: "calendar",
                  calendarFilter: only ? "admin-only" : "all",
                })
              }
              onEventClick={setDetailEvent}
            />
          </div>
        </div>
      ) : (
        <AdminPanelTable
          title="Events"
          headerColor="purple"
          data={filtered}
          search={search}
          onSearchChange={setSearch}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          page={page}
          onPageChange={setPage}
          filters={[
            {
              id: "status",
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "View All" },
                { value: "Draft", label: "Draft" },
                { value: "Active", label: "Active" },
              ],
            },
          ]}
          columns={
            route.tab === "once"
              ? [
                  {
                    key: "status",
                    header: "Status",
                    render: (row) => <StatusBadge status={row.status ?? "Draft"} />,
                  },
                  {
                    key: "date",
                    header: "Date",
                    className: "whitespace-nowrap",
                    render: (row) => formatDisplayDate(row.date),
                  },
                  {
                    key: "created",
                    header: "Created",
                    hideBelow: "md",
                    className: "whitespace-nowrap",
                    render: (row) => row.created ?? "—",
                  },
                  {
                    key: "title",
                    header: "Title",
                    render: (row) => (
                      <button
                        type="button"
                        onClick={() => setDetailEvent(row)}
                        className="text-left text-[#3476ef] hover:underline"
                      >
                        {row.title}
                      </button>
                    ),
                  },
                  {
                    key: "location",
                    header: "Location",
                    hideBelow: "lg",
                    render: (row) => row.location ?? "—",
                  },
                  {
                    key: "showTo",
                    header: "Show To",
                    hideBelow: "lg",
                    render: (row) => row.showTo ?? "—",
                  },
                  {
                    key: "actions",
                    header: "",
                    className: "whitespace-nowrap",
                    render: (row) => (
                      <OptionsDropdown
                        options={[
                          { label: "View", onClick: () => setDetailEvent(row) },
                          {
                            label: "Delete",
                            onClick: () => {
                              pendingEventIdRef.current = row.id;
                              void deleteEventRun();
                            },
                          },
                        ]}
                      />
                    ),
                  },
                ]
              : [
                  {
                    key: "status",
                    header: "Status",
                    render: (row) => <StatusBadge status={row.status ?? "Draft"} />,
                  },
                  {
                    key: "created",
                    header: "Created",
                    className: "whitespace-nowrap",
                    render: (row) => row.created ?? "—",
                  },
                  {
                    key: "title",
                    header: "Title",
                    render: (row) => (
                      <button
                        type="button"
                        onClick={() => setDetailEvent(row)}
                        className="text-left text-[#3476ef] hover:underline"
                      >
                        {row.title}
                      </button>
                    ),
                  },
                  {
                    key: "occurrence",
                    header: "Occurrence",
                    render: (row) => row.occurrence ?? "—",
                  },
                  {
                    key: "day",
                    header: "Day",
                    render: (row) => row.day ?? "—",
                  },
                  {
                    key: "showTo",
                    header: "Show To",
                    hideBelow: "md",
                    render: (row) => row.showTo ?? "—",
                  },
                  {
                    key: "actions",
                    header: "",
                    className: "whitespace-nowrap",
                    render: (row) => (
                      <OptionsDropdown
                        options={[
                          { label: "View", onClick: () => setDetailEvent(row) },
                          {
                            label: "Delete",
                            onClick: () => {
                              pendingEventIdRef.current = row.id;
                              void deleteEventRun();
                            },
                          },
                        ]}
                      />
                    ),
                  },
                ]
          }
        />
      )}

      <AddEventModal
        open={addOpen}
        eventType={listEventType}
        onClose={() => setAddOpen(false)}
        onSubmit={async (event) => {
          pendingCreateRef.current = event;
          await createEventRun();
        }}
      />

      <EventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)} />
    </>
  );
}
