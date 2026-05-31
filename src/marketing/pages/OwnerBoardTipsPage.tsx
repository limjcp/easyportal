import { MarketingContentPage } from "./MarketingContentPage";
import { ownerAndBoardTipsPageContent } from "../data/pageContent/ownerAndBoardTips";

type OwnerBoardTipsPageProps = {
  onNavigate: (path: string) => void;
};

export function OwnerBoardTipsPage({ onNavigate }: OwnerBoardTipsPageProps) {
  return <MarketingContentPage content={ownerAndBoardTipsPageContent} onNavigate={onNavigate} />;
}

