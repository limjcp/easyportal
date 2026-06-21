import { requireSupabase } from "../../lib/supabaseClient";

export type SendPortalEmailPayload =
  | { type: "employee_login_details"; membershipId: string }
  | { type: "building_admin_login_details"; membershipId: string }
  | { type: "vendor_invite"; vendorId: string; email: string }
  | { type: "certificate_resend"; certificateId: string };

export type SendPortalEmailResult = {
  ok: boolean;
  message: string;
  email?: string;
};

export async function invokeSendPortalEmail(
  payload: SendPortalEmailPayload
): Promise<SendPortalEmailResult> {
  const { data, error } = await requireSupabase().functions.invoke("send-portal-email", {
    body: payload,
  });

  const body = data as { error?: string; ok?: boolean; message?: string; email?: string } | null;
  if (error || body?.error) {
    throw new Error(body?.error ?? error?.message ?? "Failed to send email.");
  }

  return {
    ok: body?.ok ?? true,
    message: body?.message ?? "Email sent.",
    email: body?.email,
  };
}
