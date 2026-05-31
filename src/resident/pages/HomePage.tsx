import { TileGrid } from "../components/TileGrid";
import type { ResidentRoute } from "../navigation";

export function HomePage({ onNavigate }: { onNavigate: (route: ResidentRoute) => void }) {
  return <TileGrid onNavigate={onNavigate} />;
}
