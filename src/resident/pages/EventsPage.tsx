import { useEffect, useState } from "react";
import { Calendar } from "../components/Calendar";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { usePortalConfig } from "../context/PortalConfigContext";
import { residentRepo } from "../data/mockRepository";
import type { CalendarEvent } from "../data/types";

export function EventsPage() {
  const { publicPortalSettings } = usePortalConfig();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    residentRepo.getEvents().then(setEvents);
  }, []);

  return (
    <div>
      <ModuleMessageBanner moduleId="events" />
      <h2
        className="rounded-t-sm px-4 py-2 text-lg font-semibold text-white"
        style={{ backgroundColor: publicPortalSettings.portalThemeColor }}
      >
        Events
      </h2>
      <Calendar events={events} />
    </div>
  );
}
