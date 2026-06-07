import { MARKETING_PATHS, type MarketingNavItem } from "../../navigation";
import { pe } from "../../typography";
import { ArrowUpRightIcon } from "../icons";
import { EditorialSectionHeader } from "./EditorialSectionHeader";

type ExploreSectionProps = {
  items: MarketingNavItem[];
  onNavigate: (path: string) => void;
};

export function ExploreSection({ items, onNavigate }: ExploreSectionProps) {
  return (
    <section id="explore" className="px-6 py-28 md:px-12 lg:px-20 md:py-36">
      <EditorialSectionHeader
        eyebrow="Resources"
        title="Explore"
        count={`(${String(items.length).padStart(2, "0")}) Links`}
      />

      <div className="divide-y divide-border">
        {items.map((item, index) => (
          <button
            key={item.page}
            type="button"
            onClick={() => onNavigate(MARKETING_PATHS[item.page])}
            className="group flex items-start md:items-center justify-between py-7 md:py-8 gap-6 w-full text-left"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-10 flex-1">
              <span className={`${pe.eyebrowSm} text-muted-foreground/50 shrink-0 w-24 tabular-nums`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className={`${pe.listTitle} text-foreground group-hover:text-muted-foreground transition-colors duration-300`}>
                {item.label}
              </h3>
            </div>
            <ArrowUpRightIcon className={`${pe.iconSm} text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 shrink-0`} />
          </button>
        ))}
      </div>
    </section>
  );
}
