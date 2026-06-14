import { cn } from "../../../utils/cn";
import { pe } from "../../typography";

type EditorialSectionHeaderProps = {
  eyebrow: string;
  title: string;
  count?: string;
  variant?: "default" | "editorial";
};

export function EditorialSectionHeader({
  eyebrow,
  title,
  count,
  variant = "default",
}: EditorialSectionHeaderProps) {
  const isEditorial = variant === "editorial";

  return (
    <div
      className={cn(
        "mb-16 pb-6 border-b border-border md:mb-20",
        isEditorial
          ? "flex flex-col items-center text-center"
          : "flex flex-col md:flex-row md:items-end justify-between"
      )}
    >
      <div className={isEditorial ? "max-w-4xl" : undefined}>
        <p className={`${pe.eyebrow} text-muted-foreground mb-3`}>{eyebrow}</p>
        <h2 className={isEditorial ? `${pe.editorialSectionTitle} text-foreground` : `${pe.sectionTitle} text-foreground`}>
          {title}
        </h2>
      </div>
      {count && (
        <span
          className={cn(
            `${pe.eyebrowSm} text-muted-foreground/50`,
            isEditorial ? "mt-4" : "mt-4 md:mt-0"
          )}
        >
          {count}
        </span>
      )}
    </div>
  );
}
