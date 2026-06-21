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

    if (!supabaseUrl || !serviceRoleKey) {
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

    const { error: deleteError } = await admin
      .from("quickbooks_connections")
      .delete()
      .eq("building_id", buildingId);
    if (deleteError) return jsonResponse({ error: deleteError.message }, 400);

    return jsonResponse({ buildingId, disconnected: true });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Disconnect failed." }, 500);
  }
});
