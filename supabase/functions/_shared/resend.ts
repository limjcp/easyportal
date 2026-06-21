export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export function getEmailFromAddress(): string {
  return Deno.env.get("EMAIL_FROM")?.trim() || "EasyPortal <no-reply@easyportal.ca>";
}

export function getPortalAppUrl(): string {
  const url = Deno.env.get("PORTAL_APP_URL")?.trim() || "http://localhost:5173";
  return url.replace(/\/$/, "");
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim() ?? "";
  if (!apiKey) {
    throw new Error("Email is not configured. Set RESEND_API_KEY on the server.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFromAddress(),
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) detail = body.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(`Failed to send email: ${detail}`);
  }
}

export function generateTempPassword(length = 16): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}
