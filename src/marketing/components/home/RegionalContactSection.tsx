import { SITE_CONTACT } from "../../data/siteContent";
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
    <section className="px-6 py-28 md:px-12 lg:px-20 md:py-36 border-t border-border">
      <EditorialSectionHeader
        eyebrow="Call the office most convenient for your board"
        title="Regional Contact Lines"
        count="(04) Lines"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
        {REGIONAL_LINES.map((line, index) => (
          <div key={line.label} className="bg-background p-8 md:p-12">
            <span className={`${pe.eyebrowSm} text-muted-foreground/40`}>
              ({String(index + 1).padStart(2, "0")})
            </span>
            <h3 className={`mt-10 ${pe.cardTitleLg} text-foreground mb-5`}>{line.label}</h3>
            <div className="w-8 h-px bg-border mb-5" />
            <p className={`${pe.bodySm} text-muted-foreground`}>{line.value}</p>
          </div>
        ))}
      </div>

      <p className={`mt-12 ${pe.bodySm} text-muted-foreground`}>
        Email:{" "}
        <a
          href={`mailto:${SITE_CONTACT.email}`}
          className="text-foreground border-b border-foreground/20 pb-0.5 hover:border-foreground/60 transition-colors duration-300"
        >
          {SITE_CONTACT.email}
        </a>
      </p>
    </section>
  );
}
