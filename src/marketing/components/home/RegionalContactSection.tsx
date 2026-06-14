import { SITE_CONTACT } from "../../data/siteContent";
import { EDITORIAL_CONTAINER_WIDE, EDITORIAL_SECTION_PY } from "../../editorialLayout";
import { ScrollReveal } from "../ScrollReveal";
import { pe } from "../../typography";
import { EditorialSectionHeader } from "./EditorialSectionHeader";

const REGIONAL_LINES = [
  { label: "Toll Free", value: SITE_CONTACT.tollFree },
  { label: "GTA", value: SITE_CONTACT.gta },
  { label: "Southwestern Ontario", value: SITE_CONTACT.southwestern },
  { label: "Barrie", value: SITE_CONTACT.barrie },
] as const;

export function RegionalContactSection() {
  return (
    <section className={`${EDITORIAL_SECTION_PY} border-t border-border`}>
      <div className={EDITORIAL_CONTAINER_WIDE}>
        <ScrollReveal>
          <EditorialSectionHeader
            variant="editorial"
            eyebrow="Call the office most convenient for your board"
            title="Regional Contact Lines"
            count="(04) Lines"
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          {REGIONAL_LINES.map((line, index) => (
            <ScrollReveal key={line.label} delay={index * 80} className="bg-background p-8 md:p-10 lg:p-12 text-center md:text-left">
              <span className={`${pe.eyebrowSm} text-muted-foreground/40`}>
                ({String(index + 1).padStart(2, "0")})
              </span>
              <h3 className={`mt-8 ${pe.editorialCardTitle} text-foreground mb-5`}>{line.label}</h3>
              <div className="w-10 h-px bg-border mb-5 mx-auto md:mx-0" />
              <p className={`${pe.editorialBody} text-muted-foreground`}>{line.value}</p>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="mt-12 text-center">
          <p className={`${pe.editorialBodySm} text-muted-foreground`}>
            Email:{" "}
            <a
              href={`mailto:${SITE_CONTACT.email}`}
              className="text-foreground border-b border-foreground/20 pb-0.5 hover:border-foreground/60 transition-colors duration-300"
            >
              {SITE_CONTACT.email}
            </a>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
