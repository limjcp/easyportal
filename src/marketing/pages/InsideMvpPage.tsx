import { MarketingContentPage } from "./MarketingContentPage";
import { insideMvpPageContent } from "../data/pageContent/insideMvp";

type InsideMvpPageProps = {
  onNavigate: (path: string) => void;
};

export function InsideMvpPage({ onNavigate }: InsideMvpPageProps) {
  return <MarketingContentPage content={insideMvpPageContent} onNavigate={onNavigate} />;
}

