import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { canAccessBuilding } from "../_shared/buildingAccess.ts";

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

function sanitizeReturnUrl(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const clientId = Deno.env.get("INTUIT_CLIENT_ID") ?? "";
    const redirectUrl = Deno.env.get("INTUIT_REDIRECT_URL") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !clientId || !redirectUrl) {
      return jsonResponse({ error: "Server configuration error." }, 500);
    }

    const user = await requireUser(req);
    const body = (await req.json().catch(() => ({}))) as { buildingId?: string; returnUrl?: string };
    const buildingId = body.buildingId?.trim() ?? "";
    if (!buildingId) return jsonResponse({ error: "Missing buildingId." }, 400);
    const returnUrl = sanitizeReturnUrl(body.returnUrl);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const allowed = await canAccessBuilding(admin, user.id, buildingId);
    if (!allowed) return jsonResponse({ error: "Not authorized for this building." }, 403);

    const { data: stateRow, error: stateError } = await admin
      .from("quickbooks_oauth_states")
      .insert({ building_id: buildingId, return_url: returnUrl })
      .select("id")
      .single();
    if (stateError) return jsonResponse({ error: stateError.message }, 400);

    const state = stateRow.id as string;
    const scope = encodeURIComponent("com.intuit.quickbooks.accounting");
    const authUrl =
      `https://appcenter.intuit.com/connect/oauth2` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&state=${encodeURIComponent(state)}`;

    return jsonResponse({ url: authUrl });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Failed to start OAuth." }, 500);
  }
});

