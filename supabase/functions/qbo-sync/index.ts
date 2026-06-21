import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { canAccessBuilding } from "../_shared/buildingAccess.ts";
import { buildQuickBooksQueryUrl } from "../_shared/intuitEnv.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function customerEmail(customerId: string, rawEmail: string | undefined | null): string {
  const trimmed = rawEmail?.trim() ?? "";
  return trimmed || `qbo-${customerId}@import.invalid`;
}

async function requireUser(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !anonKey) throw new Error("Server configuration error.");
  const authHeader = req.headers.get("Authorization") ?? "";
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user;
}

async function refreshToken(args: { clientId: string; clientSecret: string; refreshToken: string }) {
  const basic = btoa(`${args.clientId}:${args.clientSecret}`);
  const form = new URLSearchParams();
  form.set("grant_type", "refresh_token");
  form.set("refresh_token", args.refreshToken);
  const res = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: form,
  });
  const json = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    throw new Error(json?.error_description || json?.error || "Token refresh failed.");
  }
  return json as { access_token: string; refresh_token?: string; expires_in: number };
}

async function qboQuery(args: { realmId: string; accessToken: string; query: string }) {
  const url = buildQuickBooksQueryUrl(args.realmId, args.query);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      Accept: "application/json",
    },
  });
  const json = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    const msg = json?.Fault?.Error?.[0]?.Message || json?.error || "QuickBooks query failed.";
    throw new Error(msg);
  }
  return json as any;
}

async function importOccupanciesFromCustomers(
  admin: SupabaseClient,
  buildingId: string,
  customers: any[],
): Promise<{ occupantsImported: number; occupantsUpdated: number }> {
  let occupantsImported = 0;
  let occupantsUpdated = 0;

  for (const c of customers) {
    const customerId = String(c.Id);
    const displayName = String(c.DisplayName ?? c.FullyQualifiedName ?? c.Id);
    const email = customerEmail(customerId, c.PrimaryEmailAddr?.Address ? String(c.PrimaryEmailAddr.Address) : null);
    const now = new Date().toISOString();

    const { data: existingByQbo } = await admin
      .from("unit_occupancies")
      .select("id")
      .eq("building_id", buildingId)
      .eq("qbo_customer_id", customerId)
      .maybeSingle();

    if (existingByQbo?.id) {
      const { error } = await admin
        .from("unit_occupancies")
        .update({ resident_name: displayName, email, updated_at: now })
        .eq("id", existingByQbo.id);
      if (!error) occupantsUpdated++;
      continue;
    }

    const { data: existingByEmail } = await admin
      .from("unit_occupancies")
      .select("id")
      .eq("building_id", buildingId)
      .ilike("email", email)
      .is("archived_at", null)
      .maybeSingle();

    if (existingByEmail?.id) {
      const { error } = await admin
        .from("unit_occupancies")
        .update({
          qbo_customer_id: customerId,
          resident_name: displayName,
          email,
          updated_at: now,
        })
        .eq("id", existingByEmail.id);
      if (!error) occupantsUpdated++;
      continue;
    }

    const { error } = await admin.from("unit_occupancies").insert({
      building_id: buildingId,
      qbo_customer_id: customerId,
      resident_name: displayName,
      email,
      resident_type: "Owner",
      account_status: "Awaiting Activation",
      unit_id: null,
      profile_id: null,
    });
    if (!error) occupantsImported++;
  }

  return { occupantsImported, occupantsUpdated };
}

async function refreshBuildingCounts(admin: SupabaseClient, buildingId: string) {
  const { count: unitsCount } = await admin
    .from("units")
    .select("*", { count: "exact", head: true })
    .eq("building_id", buildingId);

  const { count: usersCount } = await admin
    .from("unit_occupancies")
    .select("*", { count: "exact", head: true })
    .eq("building_id", buildingId)
    .is("archived_at", null)
    .not("account_status", "in", '("Archived","Deleted")');

  const { count: adminsCount } = await admin
    .from("building_memberships")
    .select("*", { count: "exact", head: true })
    .eq("building_id", buildingId)
    .eq("status", "active");

  await admin
    .from("buildings")
    .update({
      units_count: unitsCount ?? 0,
      users_count: usersCount ?? 0,
      admins_count: adminsCount ?? 0,
    })
    .eq("id", buildingId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const clientId = Deno.env.get("INTUIT_CLIENT_ID") ?? "";
    const clientSecret = Deno.env.get("INTUIT_CLIENT_SECRET") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !clientId || !clientSecret) {
      return jsonResponse({ error: "Server configuration error." }, 500);
    }

    const user = await requireUser(req);
    const payload = (await req.json().catch(() => ({}))) as { buildingId?: string };
    const buildingId = payload.buildingId?.trim() ?? "";
    if (!buildingId) return jsonResponse({ error: "Missing buildingId." }, 400);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const allowed = await canAccessBuilding(admin, user.id, buildingId);
    if (!allowed) return jsonResponse({ error: "Not authorized for this building." }, 403);

    const { data: conn, error: connError } = await admin
      .from("quickbooks_connections")
      .select("building_id, realm_id, access_token, refresh_token, expires_at")
      .eq("building_id", buildingId)
      .maybeSingle();
    if (connError) return jsonResponse({ error: connError.message }, 400);
    if (!conn) return jsonResponse({ error: "QuickBooks is not connected for this building." }, 409);

    let accessToken = conn.access_token as string;
    let refreshTok = conn.refresh_token as string;
    const expiresAt = new Date(String(conn.expires_at));
    const now = new Date();
    if (Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() - now.getTime() < 60_000) {
      const refreshed = await refreshToken({ clientId, clientSecret, refreshToken: refreshTok });
      accessToken = refreshed.access_token;
      if (refreshed.refresh_token) refreshTok = refreshed.refresh_token;
      const nextExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await admin.from("quickbooks_connections").update({
        access_token: accessToken,
        refresh_token: refreshTok,
        expires_at: nextExpiresAt,
        updated_at: new Date().toISOString(),
      }).eq("building_id", buildingId);
    }

    const realmId = conn.realm_id as string;

    const customersJson = await qboQuery({
      realmId,
      accessToken,
      query: "select Id, DisplayName, Active, PrimaryEmailAddr, Balance, BalanceWithJobs from Customer",
    });
    const customers = (customersJson?.QueryResponse?.Customer ?? []) as any[];

    const invoicesJson = await qboQuery({
      realmId,
      accessToken,
      query: "select * from Invoice where Balance > '0'",
    });
    const invoices = (invoicesJson?.QueryResponse?.Invoice ?? []) as any[];

    const syncedAt = new Date().toISOString();

    if (customers.length) {
      const rows = customers.map((c) => ({
        building_id: buildingId,
        customer_id: String(c.Id),
        display_name: String(c.DisplayName ?? c.FullyQualifiedName ?? c.Id),
        primary_email: c.PrimaryEmailAddr?.Address ? String(c.PrimaryEmailAddr.Address) : null,
        active: c.Active !== false,
        balance: Number(c.Balance ?? 0),
        balance_with_jobs: Number(c.BalanceWithJobs ?? 0),
        raw: c,
        synced_at: syncedAt,
      }));
      const { error } = await admin.from("quickbooks_customers").upsert(rows, {
        onConflict: "building_id,customer_id",
      });
      if (error) return jsonResponse({ error: error.message }, 400);
    }

    if (invoices.length) {
      const rows = invoices.map((inv) => ({
        building_id: buildingId,
        invoice_id: String(inv.Id),
        doc_number: inv.DocNumber ? String(inv.DocNumber) : null,
        customer_id: String(inv.CustomerRef?.value ?? ""),
        txn_date: inv.TxnDate ?? null,
        due_date: inv.DueDate ?? null,
        total_amt: Number(inv.TotalAmt ?? 0),
        balance: Number(inv.Balance ?? 0),
        status: "open",
        raw: inv,
        synced_at: syncedAt,
      }));
      const { error } = await admin.from("quickbooks_invoices").upsert(rows, {
        onConflict: "building_id,invoice_id",
      });
      if (error) return jsonResponse({ error: error.message }, 400);
    }

    const { occupantsImported, occupantsUpdated } = await importOccupanciesFromCustomers(
      admin,
      buildingId,
      customers,
    );
    await refreshBuildingCounts(admin, buildingId);

    await admin.from("building_external_integrations").upsert({
      building_id: buildingId,
      qbo_connected: true,
      qbo_company_id: realmId,
      updated_at: syncedAt,
    });

    return jsonResponse({
      buildingId,
      realmId,
      syncedAt,
      customers: customers.length,
      invoices: invoices.length,
      occupantsImported,
      occupantsUpdated,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Sync failed." }, 500);
  }
});
