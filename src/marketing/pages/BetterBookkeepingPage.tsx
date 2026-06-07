import { EditorialContentPage } from "./EditorialContentPage";
import { betterBookkeepingPageContent } from "../data/pageContent/betterBookkeeping";

type BetterBookkeepingPageProps = {
  onNavigate: (path: string) => void;
};

export function BetterBookkeepingPage({ onNavigate }: BetterBookkeepingPageProps) {
  return <EditorialContentPage content={betterBookkeepingPageContent} onNavigate={onNavigate} />;
}
