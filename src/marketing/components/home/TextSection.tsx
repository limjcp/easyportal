import { EDITORIAL_CONTAINER, EDITORIAL_PROSE, EDITORIAL_SECTION_PY } from "../../editorialLayout";
import { EditorialRichText } from "../EditorialRichText";
import { ScrollReveal } from "../ScrollReveal";
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
          ? `${EDITORIAL_SECTION_PY} bg-foreground text-background`
          : `${EDITORIAL_SECTION_PY} border-b border-border`
      }
    >
      <ScrollReveal className={EDITORIAL_CONTAINER}>
        <div className="text-center">
          <p
            className={
              inverted
                ? `${pe.eyebrow} text-background/40 mb-4`
                : `${pe.eyebrow} text-muted-foreground mb-4`
            }
          >
            {subtitle ?? "Overview"}
          </p>
          <h2
            className={
              inverted
                ? `${pe.editorialSectionTitle} text-balance mx-auto max-w-4xl`
                : `${pe.editorialSectionTitle} text-foreground mx-auto max-w-4xl`
            }
          >
            {title}
          </h2>
        </div>

        <div className={`${EDITORIAL_PROSE} mt-10 text-center md:text-left`}>
          {paragraphs?.map((paragraph) => (
            <p
              key={paragraph}
              className={
                inverted
                  ? `mt-6 first:mt-0 ${pe.editorialBody} text-background/60`
                  : `mt-6 first:mt-0 ${pe.editorialBody} text-muted-foreground`
              }
            >
              <EditorialRichText text={paragraph} />
            </p>
          ))}
          {bullets && (
            <ul
              className={
                inverted
                  ? `mt-8 list-disc space-y-3 pl-6 text-left ${pe.editorialBodySm} text-background/60`
                  : `mt-8 list-disc space-y-3 pl-6 text-left ${pe.editorialBodySm} text-muted-foreground`
              }
            >
              {bullets.map((bullet) => (
                <li key={bullet}>
                  <EditorialRichText text={bullet} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </ScrollReveal>
    </section>
  );
}
