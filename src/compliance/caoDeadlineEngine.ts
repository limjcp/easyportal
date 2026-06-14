import { deriveObligationStatus } from "./complianceScore";
import type { ComplianceObligation, ComplianceObligationSource } from "./types";

export type CaoProfileInput = {
  fiscalYearEnd?: string;
  lastAgmDate?: string;
  corpNumber?: string;
};

type RawObligation = {
  title: string;
  description: string;
  category: string;
  dueDate: string;
  startDate: string;
  caoReference?: string;
};

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function defaultFiscalYearEnd(today: string): string {
  const year = parseInt(today.slice(0, 4), 10);
  const candidate = `${year}-12-31`;
  return candidate >= today ? candidate : `${year + 1}-12-31`;
}

export function buildCaoEngineObligations(
  profile: CaoProfileInput,
  source: ComplianceObligationSource = "cao_engine"
): Omit<ComplianceObligation, "id" | "buildingId">[] {
  const today = new Date().toISOString().slice(0, 10);
  const fiscalEnd = profile.fiscalYearEnd ?? defaultFiscalYearEnd(today);
  const lastAgm = profile.lastAgmDate ?? addMonths(fiscalEnd, -6);

  const raw: RawObligation[] = [
    {
      title: "Annual General Meeting",
      description: "Hold AGM within six months after fiscal year end.",
      category: "Governance",
      startDate: addDays(fiscalEnd, 1),
      dueDate: addMonths(fiscalEnd, 6),
      caoReference: "CAO-AGM",
    },
    {
      title: "Annual Return Filing",
      description: "File annual return with CAO within 60 days of AGM.",
      category: "CAO Filing",
      startDate: lastAgm,
      dueDate: addDays(lastAgm, 60),
      caoReference: "CAO-ANNUAL-RETURN",
    },
    {
      title: "Periodic Information Certificate",
      description: "Issue periodic information certificate to owners (quarterly cycle).",
      category: "Owner Communication",
      startDate: addMonths(today, -2),
      dueDate: addMonths(today, 1),
      caoReference: "CAO-PIC",
    },
    {
      title: "Annual Budget Approval",
      description: "Board approves annual budget before start of fiscal period.",
      category: "Financial",
      startDate: addMonths(fiscalEnd, -2),
      dueDate: fiscalEnd,
      caoReference: "CAO-BUDGET",
    },
    {
      title: "Insurance Certificate Review",
      description: "Confirm corporation insurance certificate is current.",
      category: "Insurance",
      startDate: addMonths(today, -10),
      dueDate: addMonths(today, 2),
      caoReference: "CAO-INSURANCE",
    },
    {
      title: "Reserve Fund Plan Review",
      description: "Review reserve fund study updates and funding plan.",
      category: "Financial",
      startDate: addMonths(fiscalEnd, -4),
      dueDate: addMonths(fiscalEnd, 1),
      caoReference: "CAO-RESERVE",
    },
  ];

  return raw.map((item, index) => {
    const progressPercent =
      item.dueDate < today ? 0 : item.startDate <= today ? Math.min(85, 30 + index * 10) : 0;
    const status = deriveObligationStatus(item.dueDate, undefined, progressPercent, today);
    return {
      title: item.title,
      description: item.description,
      category: item.category,
      dueDate: item.dueDate,
      startDate: item.startDate,
      status,
      progressPercent,
      source,
      caoReference: item.caoReference,
    };
  });
}

export function parseCorpRegion(corpNumber: string): string {
  const normalized = corpNumber.trim().toUpperCase();
  if (normalized.startsWith("TSCC") || normalized.startsWith("MTCC")) return "Toronto";
  if (normalized.startsWith("YRCC") || normalized.startsWith("YRSCC")) return "York";
  if (normalized.startsWith("PSCC") || normalized.startsWith("PCC")) return "Peel";
  if (normalized.startsWith("HSCC")) return "Halton";
  if (normalized.startsWith("DSCC")) return "Durham";
  return "Toronto";
}

export function parseCaoCalendarHtml(html: string): RawObligation[] {
  const results: RawObligation[] = [];
  const rowPattern =
    /<tr[^>]*>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<\/tr>/gi;
  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(html)) !== null) {
    const title = match[1].replace(/\s+/g, " ").trim();
    const dateText = match[2].replace(/\s+/g, " ").trim();
    const dateMatch = dateText.match(/(\d{4}-\d{2}-\d{2})|((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i);
    if (!title || title.length < 4) continue;
    let dueDate = new Date().toISOString().slice(0, 10);
    if (dateMatch?.[1]) dueDate = dateMatch[1];
    else if (dateMatch?.[0]) {
      const parsed = new Date(dateMatch[0]);
      if (!Number.isNaN(parsed.getTime())) dueDate = parsed.toISOString().slice(0, 10);
    }
    results.push({
      title,
      description: "Imported from CAO Condo Calendar Tool.",
      category: "CAO",
      startDate: addMonths(dueDate, -1),
      dueDate,
      caoReference: "CAO-SCRAPE",
    });
  }
  return results;
}

export async function fetchCaoCalendarObligations(
  corpNumber: string,
  region: string
): Promise<RawObligation[]> {
  const searchUrl = "https://www.condoauthorityontario.ca/condo-calendar-tool-search/";
  const response = await fetch(searchUrl, {
    headers: { "User-Agent": "MVP-Condos-Compliance-Sync/1.0" },
  });
  if (!response.ok) throw new Error(`CAO search page returned ${response.status}`);
  const html = await response.text();
  const parsed = parseCaoCalendarHtml(html);
  if (parsed.length > 0) return parsed;

  const detailsUrl = `https://www.condoauthorityontario.ca/condo-calendar-tool-details/?corp=${encodeURIComponent(corpNumber)}&region=${encodeURIComponent(region)}`;
  const detailsResponse = await fetch(detailsUrl, {
    headers: { "User-Agent": "MVP-Condos-Compliance-Sync/1.0" },
  });
  if (!detailsResponse.ok) throw new Error(`CAO details page returned ${detailsResponse.status}`);
  const detailsHtml = await detailsResponse.text();
  const detailsParsed = parseCaoCalendarHtml(detailsHtml);
  if (detailsParsed.length === 0) {
    throw new Error("CAO calendar HTML did not contain recognizable deadline rows.");
  }
  return detailsParsed;
}
