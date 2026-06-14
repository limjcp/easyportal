import { EditorialContentPage } from "./EditorialContentPage";
import { contractorsPageContent } from "../data/pageContent/contractors";

type ContractorsPageProps = {
  onNavigate: (path: string) => void;
};

export function ContractorsPage({ onNavigate }: ContractorsPageProps) {
  return <EditorialContentPage content={contractorsPageContent} onNavigate={onNavigate} />;
}
