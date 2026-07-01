import { useEffect, useState } from "react";
import { ContentCard } from "../../shared/ContentCard";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { residentRepo } from "../data/residentRepository";
import type { NewsItem } from "../data/types";
import type { ResidentRoute } from "../navigation";

export function NewsPage({ onNavigate }: { onNavigate: (route: ResidentRoute) => void }) {
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    residentRepo.getNews().then(setItems);
  }, []);

  return (
    <div>
      <ModuleMessageBanner moduleId="news" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ContentCard
          key={item.id}
          title={item.title}
          date={item.date}
          buttonLabel="View Full News/Notice"
          onView={() => onNavigate({ page: "news-detail", id: item.id })}
        />
      ))}
      </div>
    </div>
  );
}
