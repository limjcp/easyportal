import { pe } from "../../typography";

type PageHeaderSectionProps = {
  eyebrow?: string;
  title: string;
  intro?: string;
};

export function PageHeaderSection({ eyebrow, title, intro }: PageHeaderSectionProps) {
  return (
    <section className="px-6 pt-32 pb-16 md:px-12 lg:px-20 md:pt-40 md:pb-20 border-b border-border">
      {eyebrow && (
        <p className={`${pe.eyebrow} text-muted-foreground mb-3`}>{eyebrow}</p>
      )}
      <h1 className={`${pe.pageTitle} text-foreground`}>{title}</h1>
      {intro && (
        <p className={`mt-6 max-w-2xl ${pe.body} text-muted-foreground`}>{intro}</p>
      )}
    </section>
  );
}
