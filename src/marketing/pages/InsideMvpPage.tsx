import { EditorialContentPage } from "./EditorialContentPage";
import { insideMvpPageContent } from "../data/pageContent/insideMvp";

type InsideMvpPageProps = {
  onNavigate: (path: string) => void;
};

export function InsideMvpPage({ onNavigate }: InsideMvpPageProps) {
  return <EditorialContentPage content={insideMvpPageContent} onNavigate={onNavigate} />;
}
