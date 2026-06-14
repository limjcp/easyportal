import { pe } from "../typography";

const MVP73_URL = "https://mvp73labs.com";
const ONTARIO_DATA_URL = "https://ontariodata.ca";

type FooterCreditsProps = {
  compact?: boolean;
};

export function FooterCredits({ compact = false }: FooterCreditsProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6 ${
        compact ? "py-4" : "py-6"
      }`}
    >
      <a
        href={MVP73_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
      >
        <img src="/images/credits/mvp73-labs.png" alt="MVP73 Labs" className="h-6 w-auto object-contain" />
        <span className={pe.caption}>Powered by MVP73 Labs</span>
      </a>

      <span className={`hidden sm:block ${compact ? "text-slate-300" : "text-border"}`} aria-hidden="true">
        |
      </span>

      <a
        href={ONTARIO_DATA_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
      >
        <img src="/images/credits/ontario-data.png" alt="OntarioData.ca" className="h-6 w-auto object-contain" />
        <span className={pe.caption}>Data Protection by OntarioData</span>
      </a>
    </div>
  );
}
