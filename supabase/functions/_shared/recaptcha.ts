export type RecaptchaVerifyResult =
  | { ok: true; skipped: true }
  | { ok: true; skipped: false; score: number };

export async function verifyRecaptchaToken(
  token: string | null | undefined,
  expectedAction: string
): Promise<RecaptchaVerifyResult> {
  const secret = Deno.env.get("RECAPTCHA_SECRET_KEY")?.trim() ?? "";
  if (!secret) {
    return { ok: true, skipped: true };
  }

  if (!token?.trim()) {
    throw new Error("Could not verify submission. Please try again.");
  }

  const minScore = Number(Deno.env.get("RECAPTCHA_MIN_SCORE") ?? "0.5");
  const params = new URLSearchParams({
    secret,
    response: token.trim(),
  });

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("Could not verify submission. Please try again.");
  }

  const body = (await response.json()) as {
    success?: boolean;
    score?: number;
    action?: string;
    "error-codes"?: string[];
  };

  if (!body.success) {
    throw new Error("Could not verify submission. Please try again.");
  }

  if (body.action && body.action !== expectedAction) {
    throw new Error("Could not verify submission. Please try again.");
  }

  const score = typeof body.score === "number" ? body.score : 0;
  if (score < minScore) {
    throw new Error("Could not verify submission. Please try again.");
  }

  return { ok: true, skipped: false, score };
}
