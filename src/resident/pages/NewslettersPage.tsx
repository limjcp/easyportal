import { useEffect, useState } from "react";
import { ContentCard } from "../../shared/ContentCard";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { residentRepo } from "../data/mockRepository";
import type { Newsletter } from "../data/types";
import type { ResidentRoute } from "../navigation";

export function NewslettersPage({ onNavigate }: { onNavigate: (route: ResidentRoute) => void }) {
  const [items, setItems] = useState<Newsletter[]>([]);

  useEffect(() => {
    residentRepo.getNewsletters().then(setItems);
  }, []);

  return (
    <div>
      <ModuleMessageBanner moduleId="newsletters" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ContentCard
          key={item.id}
          title={item.title}
          date={item.date}
          buttonLabel="View Full Newsletter"
          onView={() => onNavigate({ page: "newsletter-detail", id: item.id })}
        />
      ))}
      </div>
    </div>
  );
}
