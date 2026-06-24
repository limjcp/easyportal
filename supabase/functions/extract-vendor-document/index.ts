import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { extractText, getDocumentProxy } from "npm:unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ExtractPayload = {
  storagePath: string;
  documentType: "insurance" | "wsib";
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return (text ?? []).join("\n").trim();
}

async function extractWithOpenAi(input: {
  documentType: "insurance" | "wsib";
  textContent?: string;
  imageBase64?: string;
  mimeType?: string;
}) {
  const apiKey = Deno.env.get("OPENAI_API_KEY")?.trim() ?? "";
  if (!apiKey) return null;

  const docLabel = input.documentType === "insurance" ? "insurance certificate" : "WSIB clearance";
  const systemPrompt = `You extract fields from Ontario contractor ${docLabel} documents. Return JSON only with keys: expiryDate (YYYY-MM-DD or null), carrier (string or null), policyNumber (string or null), coverageAmount (string or null, insurance only), confidence (0-1 number). Use null when unknown.`;

  const userParts: Array<Record<string, unknown>> = [
    { type: "text", text: `Extract ${docLabel} fields from this document.` },
  ];

  if (input.imageBase64 && input.mimeType?.startsWith("image/")) {
    userParts.push({
      type: "image_url",
      image_url: { url: `data:${input.mimeType};base64,${input.imageBase64}` },
    });
  } else if (input.textContent) {
    userParts.push({
      type: "text",
      text: `Document text:\n\n${input.textContent.slice(0, 12000)}`,
    });
  } else {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userParts },
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) return null;

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse({ error: "Server configuration error." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized." }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return jsonResponse({ error: "Unauthorized." }, 401);

    const payload = (await req.json()) as ExtractPayload;
    if (!payload.storagePath?.trim()) {
      return jsonResponse({ error: "storagePath is required." }, 400);
    }

    const vendorId = payload.storagePath.split("/")[0];
    if (!vendorId) return jsonResponse({ error: "Invalid storage path." }, 400);

    const { data: vendorUser } = await adminClient
      .from("vendor_users")
      .select("vendor_id")
      .eq("profile_id", user.id)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    const { data: vendor } = await adminClient
      .from("vendors")
      .select("company_id")
      .eq("id", vendorId)
      .maybeSingle();

    let allowed = Boolean(vendorUser);
    if (!allowed && vendor?.company_id) {
      const { data: permitted } = await adminClient.rpc("has_company_permission", {
        p_user_id: user.id,
        p_company_id: vendor.company_id,
        p_module_key: "company-vendors",
        p_action: "edit",
      });
      allowed = permitted === true;
    }

    if (!allowed) return jsonResponse({ error: "Access denied." }, 403);

    if (!Deno.env.get("OPENAI_API_KEY")?.trim()) {
      return jsonResponse({ available: false });
    }

    const { data: fileData, error: downloadError } = await adminClient.storage
      .from("vendor-documents")
      .download(payload.storagePath);
    if (downloadError || !fileData) {
      return jsonResponse({ error: "Unable to read uploaded file." }, 400);
    }

    const bytes = new Uint8Array(await fileData.arrayBuffer());
    const mimeType = fileData.type || "application/pdf";
    let parsed: Record<string, unknown> | null = null;

    if (mimeType === "application/pdf" || payload.storagePath.toLowerCase().endsWith(".pdf")) {
      const text = await extractPdfText(bytes);
      parsed = await extractWithOpenAi({
        documentType: payload.documentType,
        textContent: text,
      });
    } else if (mimeType.startsWith("image/")) {
      parsed = await extractWithOpenAi({
        documentType: payload.documentType,
        imageBase64: toBase64(bytes),
        mimeType,
      });
    }

    if (!parsed) {
      return jsonResponse({ available: false });
    }

    return jsonResponse({
      available: true,
      expiryDate: typeof parsed.expiryDate === "string" ? parsed.expiryDate : undefined,
      carrier: typeof parsed.carrier === "string" ? parsed.carrier : undefined,
      policyNumber: typeof parsed.policyNumber === "string" ? parsed.policyNumber : undefined,
      coverageAmount: typeof parsed.coverageAmount === "string" ? parsed.coverageAmount : undefined,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Extraction failed." },
      500
    );
  }
});
