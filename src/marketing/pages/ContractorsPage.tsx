import { MarketingContentPage } from "./MarketingContentPage";
import { contractorsPageContent } from "../data/pageContent/contractors";

type ContractorsPageProps = {
  onNavigate: (path: string) => void;
};

export function ContractorsPage({ onNavigate }: ContractorsPageProps) {
  return <MarketingContentPage content={contractorsPageContent} onNavigate={onNavigate} />;
}

