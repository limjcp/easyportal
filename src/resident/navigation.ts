export type ResidentRoute =
  | { page: "home" }
  | { page: "news" }
  | { page: "news-detail"; id: string }
  | { page: "documents" }
  | { page: "service-requests" }
  | { page: "incident-reports" }
  | { page: "newsletters" }
  | { page: "newsletter-detail"; id: string }
  | { page: "suggestions" }
  | { page: "events" }
  | { page: "gallery" }
  | { page: "faq" }
  | { page: "status-certificates" }
  | { page: "parking-spots" }
  | { page: "lockers" }
  | { page: "key-fobs" }
  | { page: "vehicles" }
  | { page: "guest-list" }
  | { page: "bike-spaces" }
  | { page: "pets" }
  | { page: "purchase-date-maint-fees" }
  | { page: "board-member" }
  | { page: "board-elections" }
  | { page: "board-election-vote"; electionId: string }
  | { page: "polls" }
  | { page: "fire-safety-plan" }
  | { page: "chat" };

export function getBreadcrumbs(route: ResidentRoute): { label: string; route?: ResidentRoute }[] {
  const home: ResidentRoute = { page: "home" };

  switch (route.page) {
    case "home":
      return [];
    case "news":
      return [{ label: "News & Notices", route }];
    case "news-detail":
      return [{ label: "News & Notices", route: { page: "news" } }, { label: "Full Notice" }];
    case "documents":
      return [{ label: "Documents", route }];
    case "service-requests":
      return [{ label: "Service Requests", route }];
    case "incident-reports":
      return [{ label: "Incident Report", route }];
    case "newsletters":
      return [{ label: "Newsletters", route }];
    case "newsletter-detail":
      return [
        { label: "Newsletters", route: { page: "newsletters" } },
        { label: "Newsletter" },
      ];
    case "suggestions":
      return [{ label: "Suggestions", route }];
    case "events":
      return [{ label: "Events", route }];
    case "gallery":
      return [{ label: "Albums", route }];
    case "faq":
      return [{ label: "Frequently Asked Questions", route }];
    case "status-certificates":
      return [{ label: "Status Certificates", route }];
    case "parking-spots":
      return [{ label: "Parking", route }];
    case "lockers":
      return [{ label: "Lockers", route }];
    case "key-fobs":
      return [{ label: "Key Fobs", route }];
    case "vehicles":
      return [{ label: "Vehicles", route }];
    case "guest-list":
      return [{ label: "Guest List", route }];
    case "bike-spaces":
      return [{ label: "Bike Spaces", route }];
    case "pets":
      return [{ label: "Pets", route }];
    case "purchase-date-maint-fees":
      return [{ label: "Condo Fees", route }];
    case "board-member":
      return [{ label: "Become a Board Member", route }];
    case "board-elections":
      return [{ label: "Board Elections", route }];
    case "board-election-vote":
      return [
        { label: "Board Elections", route: { page: "board-elections" } },
        { label: "Vote" },
      ];
    case "polls":
      return [{ label: "Polls", route }];
    case "fire-safety-plan":
      return [{ label: "Fire Safety Plan", route }];
    case "chat":
      return [{ label: "Chat", route }];
    default:
      return [{ label: "Home", route: home }];
  }
}

export function tileLabelToRoute(label: string): ResidentRoute | null {
  const map: Record<string, ResidentRoute | null> = {
    "News / Notices": { page: "news" },
    Documents: { page: "documents" },
    "Incident Reports": { page: "incident-reports" },
    "Service Requests": { page: "service-requests" },
    Newsletters: { page: "newsletters" },
    Suggestions: { page: "suggestions" },
    Events: { page: "events" },
    "Photo Gallery": { page: "gallery" },
    "Frequently Asked Questions": { page: "faq" },
    "Status Certificates": { page: "status-certificates" },
    Parking: { page: "parking-spots" },
    "Parking Spots": { page: "parking-spots" },
    Lockers: { page: "lockers" },
    "Key Fobs": { page: "key-fobs" },
    Vehicles: { page: "vehicles" },
    "Guest List": { page: "guest-list" },
    "Bike Spaces": { page: "bike-spaces" },
    Pets: { page: "pets" },
    "Condo Fees": { page: "purchase-date-maint-fees" },
    "Become a Board Member": { page: "board-member" },
    "Board Elections": { page: "board-elections" },
    "Fire Safety Plan": { page: "fire-safety-plan" },
    Chat: { page: "chat" },
    Polls: { page: "polls" },
  };
  return map[label] ?? null;
}
