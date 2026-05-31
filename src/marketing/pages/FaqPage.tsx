import { MarketingContentPage } from "./MarketingContentPage";
import { faqPageContent } from "../data/pageContent/faq";

type FaqPageProps = {
  onNavigate: (path: string) => void;
};

export function FaqPage({ onNavigate }: FaqPageProps) {
  return <MarketingContentPage content={faqPageContent} onNavigate={onNavigate} />;
}

