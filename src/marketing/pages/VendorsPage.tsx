import { MarketingContentPage } from "./MarketingContentPage";
import { vendorsPageContent } from "../data/pageContent/vendors";

type VendorsPageProps = {
  onNavigate: (path: string) => void;
};

export function VendorsPage({ onNavigate }: VendorsPageProps) {
  return <MarketingContentPage content={vendorsPageContent} onNavigate={onNavigate} />;
}

