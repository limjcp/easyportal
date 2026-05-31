import { MarketingContentPage } from "./MarketingContentPage";
import { theCommonElementPageContent } from "../data/pageContent/theCommonElement";

type CommonElementPageProps = {
  onNavigate: (path: string) => void;
};

export function CommonElementPage({ onNavigate }: CommonElementPageProps) {
  return <MarketingContentPage content={theCommonElementPageContent} onNavigate={onNavigate} />;
}

