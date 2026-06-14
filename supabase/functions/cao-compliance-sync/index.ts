import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SyncPayload = {
  buildingId?: string;
  corpNumber?: string;
  region?: string;
  fiscalYearEnd?: string;
  lastAgmDate?: string;
  demo?: boolean;
  force?: boolean;
};

type RawObligation = {
  title: string;
  description: string;
  category: string;
  dueDate: string;
  startDate: string;
  caoReference?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonths(iso: string, months: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function deriveStatus(dueDate: string, progressPercent: number, today: string) {
  if (dueDate < today) return "overdue";
  if (progressPercent > 0) return "in_progress";
  return "pending";
}

function buildEngineObligations(profile: { fiscalYearEnd?: string; lastAgmDate?: string }): RawObligation[] {
  const today = new Date().toISOString().slice(0, 10);
  const year = parseInt(today.slice(0, 4), 10);
  const fiscalEnd = profile.fiscalYearEnd ?? (today <= `${year}-12-31` ? `${year}-12-31` : `${year + 1}-12-31`);
  const lastAgm = profile.lastAgmDate ?? addMonths(fiscalEnd, -6);
  return [
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
      description: "Issue periodic information certificate to owners.",
      category: "Owner Communication",
      startDate: addMonths(today, -2),
      dueDate: addMonths(today, 1),
      caoReference: "CAO-PIC",
    },
    {
      title: "Annual Budget Approval",
      description: "Board approves annual budget before fiscal period.",
      category: "Financial",
      startDate: addMonths(fiscalEnd, -2),
      dueDate: fiscalEnd,
      caoReference: "CAO-BUDGET",
    },
    {
      title: "Director Training Completion",
      description: "Directors complete mandatory CAO training.",
      category: "Training",
      startDate: addMonths(today, -8),
      dueDate: addMonths(today, 4),
      caoReference: "CAO-DIRECTOR-TRAINING",
    },
  ];
}

function parseCaoHtml(html: string): RawObligation[] {
  const results: RawObligation[] = [];
  const rowPattern =
    /<tr[^>]*>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<\/tr>/gi;
  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(html)) !== null) {
    const title = match[1].replace(/\s+/g, " ").trim();
    const dateText = match[2].replace(/\s+/g, " ").trim();
    if (!title || title.length < 4) continue;
    const iso = dateText.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    const dueDate = iso ?? addMonths(new Date().toISOString().slice(0, 10), 2);
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

async function scrapeCao(corpNumber: string, region: string): Promise<RawObligation[]> {
  const urls = [
    "https://www.condoauthorityontario.ca/condo-calendar-tool-search/",
    `https://www.condoauthorityontario.ca/condo-calendar-tool-details/?corp=${encodeURIComponent(corpNumber)}&region=${encodeURIComponent(region)}`,
  ];
  for (const url of urls) {
    const res = await fetch(url, { headers: { "User-Agent": "MVP-Condos-Compliance-Sync/1.0" } });
    if (!res.ok) continue;
    const parsed = parseCaoHtml(await res.text());
    if (parsed.length > 0) return parsed;
  }
  throw new Error("CAO scrape returned no deadlines.");
}

function toDbObligations(
  buildingId: string | null,
  raw: RawObligation[],
  source: "cao_scrape" | "cao_engine",
  today: string
) {
  return raw.map((item, index) => {
    const progressPercent =
      item.dueDate < today ? 0 : item.startDate <= today ? Math.min(80, 25 + index * 12) : 0;
    return {
      building_id: buildingId,
      title: item.title,
      description: item.description,
      category: item.category,
      due_date: item.dueDate,
      start_date: item.startDate,
      status: deriveStatus(item.dueDate, progressPercent, today),
      progress_percent: progressPercent,
      source,
      cao_reference: item.caoReference ?? null,
      sort_order: index,
    };
  });
}

function demoTraining() {
  return [
    {
      director_name: "Alex Morgan",
      status: "completed",
      completed_at: addMonths(new Date().toISOString().slice(0, 10), -2),
      certificate_id: "CAO-DT-2026-001",
      hours: 6,
      source: "cao_engine",
    },
    {
      director_name: "Jordan Lee",
      status: "completed",
      completed_at: addMonths(new Date().toISOString().slice(0, 10), -1),
      certificate_id: "CAO-DT-2026-002",
      hours: 6,
      source: "cao_engine",
    },
    {
      director_name: "Sam Patel",
      status: "pending",
      hours: 0,
      source: "manual",
    },
  ];
}

async function seedDirectorTraining(
  adminClient: ReturnType<typeof createClient>,
  buildingId: string
) {
  const { data: members } = await adminClient.from("board_members").select("*").eq("building_id", buildingId);
  if (!members?.length) return [];

  const rows = members.map((m, i) => ({
    building_id: buildingId,
    board_member_id: m.id,
    director_name: m.name as string,
    status: i === 0 ? "completed" : "pending",
    completed_at: i === 0 ? addMonths(new Date().toISOString().slice(0, 10), -3) : null,
    certificate_id: i === 0 ? `CAO-DT-${String(m.id).slice(0, 8)}` : null,
    hours: i === 0 ? 6 : null,
    source: "manual",
    last_verified_at: new Date().toISOString(),
  }));

  await adminClient.from("director_training_records").delete().eq("building_id", buildingId);
  const { data } = await adminClient.from("director_training_records").insert(rows).select("*");
  return data ?? [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: "Server configuration error." }, 500);

    const payload = (await req.json()) as SyncPayload;
    const demo = payload.demo === true;
    const force = payload.force === true;
    const corpNumber = (payload.corpNumber ?? "TSCC 9999").trim();
    const region = (payload.region ?? "Toronto").trim();
    const today = new Date().toISOString().slice(0, 10);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (demo) {
      let raw: RawObligation[] = [];
      let syncStatus: "ok" | "fallback" = "ok";
      let syncError: string | null = null;
      try {
        raw = await scrapeCao(corpNumber, region);
      } catch (err) {
        syncStatus = "fallback";
        syncError = err instanceof Error ? err.message : "CAO scrape failed";
        raw = buildEngineObligations({ fiscalYearEnd: `${new Date().getFullYear()}-12-31` });
      }

      const obligations = toDbObligations(null, raw, syncStatus === "ok" ? "cao_scrape" : "cao_engine", today).map(
        (o, i) => ({ ...o, id: `demo-obl-${i}`, building_id: undefined })
      );
      const training = demoTraining().map((t, i) => ({ ...t, id: `demo-tr-${i}` }));

      const payloadJson = {
        profile: {
          corpNumber,
          caoRegion: region,
          syncStatus,
          syncError,
          lastSyncedAt: new Date().toISOString(),
        },
        obligations,
        training,
      };

      await adminClient.from("compliance_demo_snapshot").upsert({
        id: "demo",
        corp_number: corpNumber,
        cao_region: region,
        payload: payloadJson,
        last_synced_at: new Date().toISOString(),
        sync_status: syncStatus,
        sync_error: syncError,
      });

      return jsonResponse({ ok: true, demo: true, syncStatus, obligationCount: obligations.length });
    }

    const buildingId = payload.buildingId?.trim();
    if (!buildingId) return jsonResponse({ error: "buildingId is required." }, 400);

    const { data: existingProfile } = await adminClient
      .from("building_compliance_profiles")
      .select("*")
      .eq("building_id", buildingId)
      .maybeSingle();

    if (
      !force &&
      existingProfile?.last_synced_at &&
      Date.now() - new Date(existingProfile.last_synced_at as string).getTime() < 24 * 60 * 60 * 1000
    ) {
      return jsonResponse({ ok: true, cached: true, syncStatus: existingProfile.sync_status });
    }

    await adminClient.from("building_compliance_profiles").upsert({
      building_id: buildingId,
      corp_number: corpNumber,
      cao_region: region,
      fiscal_year_end: payload.fiscalYearEnd ?? existingProfile?.fiscal_year_end ?? null,
      last_agm_date: payload.lastAgmDate ?? existingProfile?.last_agm_date ?? null,
    });

    let raw: RawObligation[] = [];
    let source: "cao_scrape" | "cao_engine" = "cao_scrape";
    let syncStatus: "ok" | "fallback" = "ok";
    let syncError: string | null = null;

    try {
      raw = await scrapeCao(corpNumber, region);
    } catch (err) {
      source = "cao_engine";
      syncStatus = "fallback";
      syncError = err instanceof Error ? err.message : "CAO scrape failed";
      raw = buildEngineObligations({
        fiscalYearEnd: (payload.fiscalYearEnd ?? existingProfile?.fiscal_year_end) as string | undefined,
        lastAgmDate: (payload.lastAgmDate ?? existingProfile?.last_agm_date) as string | undefined,
      });
    }

    await adminClient
      .from("compliance_obligations")
      .delete()
      .eq("building_id", buildingId)
      .in("source", ["cao_scrape", "cao_engine"]);

    const dbRows = toDbObligations(buildingId, raw, source, today);
    await adminClient.from("compliance_obligations").insert(dbRows);

    await seedDirectorTraining(adminClient, buildingId);

    await adminClient
      .from("building_compliance_profiles")
      .update({
        last_synced_at: new Date().toISOString(),
        sync_status: syncStatus,
        sync_error: syncError,
      })
      .eq("building_id", buildingId);

    return jsonResponse({
      ok: true,
      syncStatus,
      syncError,
      obligationCount: dbRows.length,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Sync failed." }, 500);
  }
});
