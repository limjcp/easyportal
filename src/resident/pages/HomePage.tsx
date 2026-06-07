import { TileGrid } from "../components/TileGrid";
import type { ResidentRoute } from "../navigation";

export function HomePage({
  onNavigate,
  badgeRefreshKey = 0,
}: {
  onNavigate: (route: ResidentRoute) => void;
  badgeRefreshKey?: number;
}) {
  return <TileGrid onNavigate={onNavigate} badgeRefreshKey={badgeRefreshKey} />;
}
