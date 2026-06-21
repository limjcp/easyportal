import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { verifyRecaptchaToken } from "../_shared/recaptcha.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type VerifyPayload = {
  recaptchaToken?: string | null;
  action?: string;
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
    const payload = (await req.json()) as VerifyPayload;
    const action = payload.action?.trim() ?? "";
    if (!action) {
      return jsonResponse({ error: "Missing reCAPTCHA action." }, 400);
    }

    await verifyRecaptchaToken(payload.recaptchaToken, action);
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Could not verify submission. Please try again." },
      400
    );
  }
});
