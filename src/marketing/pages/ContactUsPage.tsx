import { RegionalContactSection } from "../components/home/RegionalContactSection";
import { EditorialContentPage } from "./EditorialContentPage";
import { contactUsPageContent } from "../data/pageContent/contactUs";

type ContactUsPageProps = {
  onNavigate: (path: string) => void;
};

export function ContactUsPage({ onNavigate }: ContactUsPageProps) {
  return (
    <>
      <EditorialContentPage content={contactUsPageContent} onNavigate={onNavigate} />
      <RegionalContactSection />
    </>
  );
}
