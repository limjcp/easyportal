import { pe } from "../../typography";

type EditorialSectionHeaderProps = {
  eyebrow: string;
  title: string;
  count?: string;
};

export function EditorialSectionHeader({ eyebrow, title, count }: EditorialSectionHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 pb-6 border-b border-border">
      <div>
        <p className={`${pe.eyebrow} text-muted-foreground mb-3`}>{eyebrow}</p>
        <h2 className={`${pe.sectionTitle} text-foreground`}>{title}</h2>
      </div>
      {count && (
        <span className={`${pe.eyebrowSm} text-muted-foreground/50 mt-4 md:mt-0`}>{count}</span>
      )}
    </div>
  );
}
