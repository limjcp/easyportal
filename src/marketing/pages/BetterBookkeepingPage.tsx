import { MarketingContentPage } from "./MarketingContentPage";
import { betterBookkeepingPageContent } from "../data/pageContent/betterBookkeeping";

type BetterBookkeepingPageProps = {
  onNavigate: (path: string) => void;
};

export function BetterBookkeepingPage({ onNavigate }: BetterBookkeepingPageProps) {
  return <MarketingContentPage content={betterBookkeepingPageContent} onNavigate={onNavigate} />;
}

