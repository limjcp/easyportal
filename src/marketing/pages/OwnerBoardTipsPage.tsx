import { EditorialContentPage } from "./EditorialContentPage";
import { ownerAndBoardTipsPageContent } from "../data/pageContent/ownerAndBoardTips";

type OwnerBoardTipsPageProps = {
  onNavigate: (path: string) => void;
};

export function OwnerBoardTipsPage({ onNavigate }: OwnerBoardTipsPageProps) {
  return <EditorialContentPage content={ownerAndBoardTipsPageContent} onNavigate={onNavigate} />;
}
