import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const html = (body: string, status = 200) =>
  new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });

function escapeHtml(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

async function exchangeToken(args: {
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  code: string;
}) {
  const basic = btoa(`${args.clientId}:${args.clientSecret}`);
  const form = new URLSearchParams();
  form.set("grant_type", "authorization_code");
  form.set("code", args.code);
  form.set("redirect_uri", args.redirectUrl);

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
    throw new Error(json?.error_description || json?.error || "Token exchange failed.");
  }
  return json as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in?: number;
  };
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const clientId = Deno.env.get("INTUIT_CLIENT_ID") ?? "";
    const clientSecret = Deno.env.get("INTUIT_CLIENT_SECRET") ?? "";
    const redirectUrl = Deno.env.get("INTUIT_REDIRECT_URL") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !clientId || !clientSecret || !redirectUrl) {
      return html("Missing server configuration.", 500);
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code") ?? "";
    const realmId = url.searchParams.get("realmId") ?? "";
    const state = url.searchParams.get("state") ?? "";
    const error = url.searchParams.get("error");
    const errorDesc = url.searchParams.get("error_description");

    if (error) {
      return html(
        `<h3>QuickBooks connection failed</h3><p>${escapeHtml(errorDesc || error)}</p>`,
        400
      );
    }

    if (!code || !realmId || !state) {
      return html("<h3>Invalid callback</h3><p>Missing required parameters.</p>", 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: stateRow, error: stateError } = await admin
      .from("quickbooks_oauth_states")
      .select("id, building_id, created_at")
      .eq("id", state)
      .maybeSingle();

    if (stateError) return html(`<h3>QuickBooks connection failed</h3><p>${escapeHtml(stateError.message)}</p>`, 400);
    if (!stateRow) return html("<h3>QuickBooks connection failed</h3><p>State expired. Please try again.</p>", 400);

    // Consume state.
    await admin.from("quickbooks_oauth_states").delete().eq("id", stateRow.id);

    const token = await exchangeToken({ clientId, clientSecret, redirectUrl, code });
    const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();

    const buildingId = stateRow.building_id as string;

    const { error: upsertError } = await admin.from("quickbooks_connections").upsert({
      building_id: buildingId,
      realm_id: realmId,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: expiresAt,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (upsertError) return html(`<h3>QuickBooks connection failed</h3><p>${escapeHtml(upsertError.message)}</p>`, 400);

    // Keep existing UI flags working.
    await admin.from("building_external_integrations").upsert({
      building_id: buildingId,
      qbo_connected: true,
      qbo_company_id: realmId,
      updated_at: new Date().toISOString(),
    });

    return html(`<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>QuickBooks Connected</title></head>
  <body style="font-family: system-ui; padding: 24px;">
    <h3>QuickBooks Online connected</h3>
    <p>You can close this window and return to EasyPortal.</p>
    <script>
      try {
        if (window.opener) {
          window.opener.postMessage({ type: "qbo-connected", realmId: ${JSON.stringify(realmId)} }, "*");
        }
      } catch {}
      setTimeout(() => window.close(), 400);
    </script>
  </body>
</html>`);
  } catch (err) {
    return html(`<h3>QuickBooks connection failed</h3><p>${escapeHtml(err instanceof Error ? err.message : "Unknown error")}</p>`, 500);
  }
});

