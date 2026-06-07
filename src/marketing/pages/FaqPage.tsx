import { EditorialContentPage } from "./EditorialContentPage";
import { faqPageContent } from "../data/pageContent/faq";

type FaqPageProps = {
  onNavigate: (path: string) => void;
};

export function FaqPage({ onNavigate }: FaqPageProps) {
  return <EditorialContentPage content={faqPageContent} onNavigate={onNavigate} />;
}
