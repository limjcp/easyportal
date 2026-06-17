import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RegisterPayload = {
  email?: string;
  firstName?: string;
  corpNumber?: string;
  city?: string;
  unitNumber?: string;
  residentType?: string;
  buildingId?: string;
  quickbooksMatched?: boolean;
  quickbooksBalance?: string | null;
};

const RESIDENT_TYPES = new Set([
  "Owner",
  "Tenant",
  "Absentee Owner",
  "Occupant",
  "Unit Manager",
]);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Server configuration error." }, 500);
    }

    const payload = (await req.json()) as RegisterPayload;
    const email = payload.email?.trim().toLowerCase() ?? "";
    const firstName = payload.firstName?.trim() ?? "";
    const corpNumber = payload.corpNumber?.trim() ?? "";
    const city = payload.city?.trim() ?? "";
    const unitNumber = payload.unitNumber?.trim() ?? "";
    const residentType = payload.residentType?.trim() ?? "";
    const buildingId = payload.buildingId?.trim() ?? "";

    if (!email || !firstName || !corpNumber || !city || !unitNumber || !residentType || !buildingId) {
      return jsonResponse({ error: "Missing required fields." }, 400);
    }
    if (!RESIDENT_TYPES.has(residentType)) {
      return jsonResponse({ error: "Invalid resident type." }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: building, error: buildingError } = await adminClient
      .from("buildings")
      .select("id, corp_number, city, status")
      .eq("id", buildingId)
      .maybeSingle();

    if (buildingError) {
      return jsonResponse({ error: buildingError.message }, 400);
    }
    if (!building || building.status !== "active") {
      return jsonResponse({ error: "Building not found." }, 404);
    }
    if (
      normalize(building.corp_number as string) !== normalize(corpNumber) ||
      normalize(building.city as string) !== normalize(city)
    ) {
      return jsonResponse({ error: "Building details do not match." }, 400);
    }

    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existingProfile?.id) {
      return jsonResponse({ error: "An account with this email already exists. Sign in instead." }, 409);
    }

    const { data: existingRequest } = await adminClient
      .from("portal_signup_requests")
      .select("id")
      .eq("building_id", buildingId)
      .ilike("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingRequest?.id) {
      return jsonResponse({ error: "A pending registration already exists for this email." }, 409);
    }

    const { data: requestRow, error: requestError } = await adminClient
      .from("portal_signup_requests")
      .insert({
        profile_id: null,
        building_id: buildingId,
        unit_number: unitNumber,
        first_name: firstName,
        corp_number: corpNumber,
        city,
        resident_type: residentType,
        email,
        quickbooks_matched: payload.quickbooksMatched === true,
        quickbooks_balance: payload.quickbooksBalance ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (requestError) {
      return jsonResponse({ error: requestError.message }, 400);
    }

    return jsonResponse({
      requestId: requestRow.id,
      status: "pending",
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Registration failed." }, 500);
  }
});
