import { HOME_MAIN_TOPICS } from "../data/homeMainTopics";
import { HomeTopicCarousel } from "../components/home/HomeTopicCarousel";
import { PartnerLogosSection } from "../components/home/PartnerLogosSection";

type HomePageProps = {
  onNavigate: (path: string) => void;
};

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <>
      <HomeTopicCarousel topics={HOME_MAIN_TOPICS} onNavigate={onNavigate} />
      <PartnerLogosSection compact onNavigate={onNavigate} />
    </>
  );
}
