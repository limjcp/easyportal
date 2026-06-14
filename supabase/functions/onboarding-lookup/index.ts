import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LookupPayload = {
  corpNumber?: string;
  city?: string;
  unitNumber?: string;
  firstName?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function mockQuickBooksBalance(unitNumber: string, firstName: string) {
  const seed = `${unitNumber}:${firstName}`.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const dollars = 75 + (seed % 450);
  const cents = seed % 100;
  return `$${dollars}.${String(cents).padStart(2, "0")}`;
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

    const payload = (await req.json()) as LookupPayload;
    const corpNumber = payload.corpNumber?.trim() ?? "";
    const city = payload.city?.trim() ?? "";
    const unitNumber = payload.unitNumber?.trim() ?? "";
    const firstName = payload.firstName?.trim() ?? "";

    if (!corpNumber || !city || !unitNumber || !firstName) {
      return jsonResponse({ error: "Corp number, city, unit number, and first name are required." }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: buildings, error: buildingError } = await adminClient
      .from("buildings")
      .select("id, name, condo_name, corporation, corp_number, address, city, city_province_postal, status")
      .eq("status", "active");

    if (buildingError) {
      return jsonResponse({ error: buildingError.message }, 400);
    }

    const match = (buildings ?? []).find(
      (b) => normalize(b.corp_number as string) === normalize(corpNumber) && normalize(b.city as string) === normalize(city)
    );

    if (!match) {
      return jsonResponse(
        {
          error:
            "We couldn't find your corporation. Check your corporation number and city, or contact your property manager.",
        },
        404
      );
    }

    const { data: integration } = await adminClient
      .from("building_external_integrations")
      .select("qbo_connected")
      .eq("building_id", match.id)
      .maybeSingle();

    const quickbooksMatched = integration?.qbo_connected === true;
    const quickbooksBalance = quickbooksMatched ? mockQuickBooksBalance(unitNumber, firstName) : null;

    return jsonResponse({
      buildingId: match.id,
      buildingName: (match.condo_name as string) || (match.name as string),
      corporation: match.corporation as string,
      address: (match.address as string) || (match.city_province_postal as string),
      city: match.city as string,
      unitNumber,
      firstName,
      quickbooksMatched,
      quickbooksBalance,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Lookup failed." }, 500);
  }
});
