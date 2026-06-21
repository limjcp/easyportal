type EdgeFunctionErrorBody = { error?: string } | null;

const FRIENDLY_MESSAGES: Record<string, string> = {
  "Not authorized for this building.":
    "You don't have permission to connect QuickBooks for this building. Ask a company administrator to assign you to this building, or clear building assignments if you should have access to all buildings.",
  "Not authenticated":
    "Your session has expired. Sign out and sign in again, then retry.",
  "Missing authorization.":
    "Your session has expired. Sign out and sign in again, then retry.",
  "Missing buildingId.":
    "No building is selected. Open the building from the company portal and try again.",
  "Server configuration error.":
    "QuickBooks is not configured on the server. Contact support.",
};

function mapFriendlyMessage(raw: string): string {
  return FRIENDLY_MESSAGES[raw] ?? raw;
}

async function readHttpErrorBody(error: unknown): Promise<string | null> {
  if (!error || typeof error !== "object") return null;
  const record = error as { name?: string; context?: unknown; message?: string };
  if (record.name !== "FunctionsHttpError") return null;

  const context = record.context;
  if (!context || typeof context !== "object") return null;

  const response = context as { json?: () => Promise<unknown> };
  if (typeof response.json !== "function") return null;

  try {
    const body = (await response.json()) as { error?: string };
    return body?.error?.trim() || null;
  } catch {
    return null;
  }
}

export async function parseEdgeFunctionError(
  data: EdgeFunctionErrorBody,
  error: unknown,
  fallback: string
): Promise<string> {
  if (data?.error?.trim()) {
    return mapFriendlyMessage(data.error.trim());
  }

  const httpBodyError = await readHttpErrorBody(error);
  if (httpBodyError) {
    return mapFriendlyMessage(httpBodyError);
  }

  if (error instanceof Error) {
    const message = error.message.trim();
    if (message && message !== "Edge Function returned a non-2xx status code") {
      return mapFriendlyMessage(message);
    }
  }

  return fallback;
}

export async function assertEdgeFunctionOk<T extends EdgeFunctionErrorBody>(
  data: T,
  error: unknown,
  fallback: string
): Promise<void> {
  const message = await parseEdgeFunctionError(data, error, fallback);
  if (data?.error || error) {
    throw new Error(message);
  }
}
