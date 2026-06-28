import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { extractText, getDocumentProxy } from "npm:unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-2.0-flash";

type ExtractPayload = {
  storagePath: string;
  documentType: "insurance" | "wsib";
};

type ExtractedFields = {
  expiryDate?: string;
  carrier?: string;
  policyNumber?: string;
  coverageAmount?: string;
  confidence?: number;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getGeminiApiKey(): string {
  return (
    Deno.env.get("GEMINI_API_KEY")?.trim() ??
    Deno.env.get("GOOGLE_API_KEY")?.trim() ??
    ""
  );
}

function normalizeExpiryDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return undefined;
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return (text ?? []).join("\n").trim();
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function buildExtractionPrompt(documentType: "insurance" | "wsib"): string {
  const docLabel = documentType === "insurance" ? "insurance certificate" : "WSIB clearance";
  return [
    `Extract fields from this Ontario contractor ${docLabel} document.`,
    "Return JSON only with keys:",
    "expiryDate (YYYY-MM-DD or null),",
    "carrier (string or null),",
    "policyNumber (string or null),",
    "coverageAmount (string or null, insurance only),",
    "confidence (0-1 number).",
    "Use null when unknown. Prefer the certificate expiry / valid-until date.",
  ].join(" ");
}

async function extractWithGemini(input: {
  documentType: "insurance" | "wsib";
  textContent?: string;
  imageBase64?: string;
  mimeType?: string;
}): Promise<ExtractedFields | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const parts: Array<Record<string, unknown>> = [
    { text: buildExtractionPrompt(input.documentType) },
  ];

  if (input.imageBase64 && input.mimeType?.startsWith("image/")) {
    parts.push({
      inline_data: {
        mime_type: input.mimeType,
        data: input.imageBase64,
      },
    });
  } else if (input.textContent) {
    parts.push({
      text: `Document text:\n\n${input.textContent.slice(0, 12000)}`,
    });
  } else {
    return null;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) return null;

  const body = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const content = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      expiryDate: normalizeExpiryDate(parsed.expiryDate),
      carrier: typeof parsed.carrier === "string" ? parsed.carrier : undefined,
      policyNumber: typeof parsed.policyNumber === "string" ? parsed.policyNumber : undefined,
      coverageAmount:
        typeof parsed.coverageAmount === "string" ? parsed.coverageAmount : undefined,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined,
    };
  } catch {
    return null;
  }
}

async function userCanManageVendorCompliance(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  vendorId: string,
  vendorUserLink: { vendor_id: string } | null
): Promise<boolean> {
  if (vendorUserLink) return true;

  const { data: vendor } = await adminClient
    .from("vendors")
    .select("company_id")
    .eq("id", vendorId)
    .maybeSingle();

  if (!vendor?.company_id) return false;

  const { data: canView } = await adminClient.rpc("has_company_permission", {
    p_user_id: userId,
    p_company_id: vendor.company_id,
    p_module_key: "company-vendors",
    p_action: "view",
  });

  return canView === true;
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

    const allowed = await userCanManageVendorCompliance(
      adminClient,
      user.id,
      vendorId,
      vendorUser
    );
    if (!allowed) return jsonResponse({ error: "Access denied." }, 403);

    if (!getGeminiApiKey()) {
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
    let parsed: ExtractedFields | null = null;

    if (mimeType === "application/pdf" || payload.storagePath.toLowerCase().endsWith(".pdf")) {
      const text = await extractPdfText(bytes);
      parsed = await extractWithGemini({
        documentType: payload.documentType,
        textContent: text,
      });
    } else if (mimeType.startsWith("image/")) {
      parsed = await extractWithGemini({
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
      expiryDate: parsed.expiryDate,
      carrier: parsed.carrier,
      policyNumber: parsed.policyNumber,
      coverageAmount: parsed.coverageAmount,
      confidence: parsed.confidence,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Extraction failed." },
      500
    );
  }
});
