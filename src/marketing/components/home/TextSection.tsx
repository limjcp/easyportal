import { pe } from "../../typography";

type TextSectionProps = {
  title: string;
  subtitle?: string;
  paragraphs?: string[];
  bullets?: string[];
  inverted?: boolean;
};

export function TextSection({ title, subtitle, paragraphs, bullets, inverted = false }: TextSectionProps) {
  return (
    <section
      className={
        inverted
          ? "px-6 py-28 md:px-12 lg:px-20 md:py-36 bg-foreground text-background"
          : "px-6 py-28 md:px-12 lg:px-20 md:py-36"
      }
    >
      <div className="max-w-3xl">
        <p
          className={
            inverted
              ? `${pe.eyebrow} text-background/40 mb-8`
              : `${pe.eyebrow} text-muted-foreground mb-3`
          }
        >
          {subtitle ?? "Overview"}
        </p>
        <h2
          className={
            inverted
              ? `${pe.sectionTitleLg} text-balance`
              : `${pe.sectionTitle} text-foreground`
          }
        >
          {title}
        </h2>
        {paragraphs?.map((paragraph) => (
          <p
            key={paragraph}
            className={
              inverted
                ? `mt-6 ${pe.body} text-background/55`
                : `mt-6 ${pe.body} text-muted-foreground`
            }
          >
            {paragraph}
          </p>
        ))}
        {bullets && (
          <ul
            className={
              inverted
                ? `mt-6 list-disc space-y-2 pl-6 ${pe.body} text-background/55`
                : `mt-6 list-disc space-y-2 pl-6 ${pe.body} text-muted-foreground`
            }
          >
            {bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
