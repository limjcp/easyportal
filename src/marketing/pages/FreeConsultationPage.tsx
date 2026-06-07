import { ConsultationIntakeSection } from "../components/home/ConsultationIntakeSection";
import { EditorialContentPage } from "./EditorialContentPage";
import { freeConsultationPageContent } from "../data/pageContent/freeConsultation";

type FreeConsultationPageProps = {
  onNavigate: (path: string) => void;
};

export function FreeConsultationPage({ onNavigate }: FreeConsultationPageProps) {
  return (
    <>
      <EditorialContentPage content={freeConsultationPageContent} onNavigate={onNavigate} />
      <ConsultationIntakeSection onNavigate={onNavigate} />
    </>
  );
}
