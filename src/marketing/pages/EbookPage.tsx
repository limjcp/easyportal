import { MarketingContentPage } from "./MarketingContentPage";
import { ebookPageContent } from "../data/pageContent/ebook";

type EbookPageProps = {
  onNavigate: (path: string) => void;
};

export function EbookPage({ onNavigate }: EbookPageProps) {
  return <MarketingContentPage content={ebookPageContent} onNavigate={onNavigate} />;
}

