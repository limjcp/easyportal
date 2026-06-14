import { EditorialContentPage } from "./EditorialContentPage";
import { vendorsPageContent } from "../data/pageContent/vendors";

type VendorsPageProps = {
  onNavigate: (path: string) => void;
};

export function VendorsPage({ onNavigate }: VendorsPageProps) {
  return <EditorialContentPage content={vendorsPageContent} onNavigate={onNavigate} />;
}
