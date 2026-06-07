import { EditorialContentPage } from "./EditorialContentPage";
import { ebookPageContent } from "../data/pageContent/ebook";

type EbookPageProps = {
  onNavigate: (path: string) => void;
};

export function EbookPage({ onNavigate }: EbookPageProps) {
  return <EditorialContentPage content={ebookPageContent} onNavigate={onNavigate} />;
}
