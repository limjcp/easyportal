import { CtaBandSection } from "../components/home/CtaBandSection";
import { InstagramReelsSection } from "../components/home/InstagramReelsSection";
import { EditorialContentPage } from "./EditorialContentPage";
import { theCommonElementPageContent } from "../data/pageContent/theCommonElement";

type CommonElementPageProps = {
  onNavigate: (path: string) => void;
};

export function CommonElementPage({ onNavigate }: CommonElementPageProps) {
  return (
    <>
      <EditorialContentPage content={theCommonElementPageContent} onNavigate={onNavigate} />
      <InstagramReelsSection />
      <CtaBandSection
        title="Want more condo insights?"
        text="Browse owner and board resources for practical guidance."
        action={{ label: "Owner and Board Tips", href: "/owner-and-board-tips", variant: "secondary" }}
        onNavigate={onNavigate}
      />
    </>
  );
}
