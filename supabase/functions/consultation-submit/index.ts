import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyRecaptchaToken } from "../_shared/recaptcha.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ConsultationPayload = {
  name?: string;
  corporationNumber?: string;
  municipalAddress?: string;
  email?: string;
  phone?: string;
  survey?: Record<string, unknown>;
  recaptchaToken?: string | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

    const payload = (await req.json()) as ConsultationPayload;
    await verifyRecaptchaToken(payload.recaptchaToken, "consultation_submit");

    const name = payload.name?.trim() ?? "";
    const email = payload.email?.trim() ?? "";
    if (!name || !email) {
      return jsonResponse({ error: "Name and email are required." }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await adminClient
      .from("consultation_submissions")
      .insert({
        name,
        corporation_number: payload.corporationNumber?.trim() ?? "",
        municipal_address: payload.municipalAddress?.trim() ?? "",
        email,
        phone: payload.phone?.trim() ?? "",
        survey: payload.survey ?? {},
      })
      .select("*")
      .single();

    if (error || !data) {
      return jsonResponse({ error: error?.message ?? "Failed to submit consultation." }, 400);
    }

    return jsonResponse({
      id: data.id,
      submittedAt: data.submitted_at,
      name: data.name,
      corporationNumber: data.corporation_number,
      municipalAddress: data.municipal_address,
      email: data.email,
      phone: data.phone,
      survey: data.survey,
      status: data.status,
      unread: data.unread,
    });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Could not verify submission. Please try again." },
      400
    );
  }
});
