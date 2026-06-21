import type {
  ConsultationSubmission,
  CreateConsultationSubmissionInput,
} from "../../resident/data/types";
import { requireSupabase, supabase } from "../../lib/supabaseClient";
import { store } from "../../legacy/resident/sharedStore";

const nextConsultationId = () => `consult-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

function mapRow(row: Record<string, unknown>): ConsultationSubmission {
  return {
    id: row.id as string,
    submittedAt: String(row.submitted_at),
    name: row.name as string,
    corporationNumber: (row.corporation_number as string) ?? "",
    municipalAddress: (row.municipal_address as string) ?? "",
    email: row.email as string,
    phone: (row.phone as string) ?? "",
    survey: row.survey as ConsultationSubmission["survey"],
    status: row.status as "new" | "contacted",
    unread: row.unread as boolean,
  };
}

async function submitToSupabase(
  input: CreateConsultationSubmissionInput,
  recaptchaToken?: string | null
): Promise<ConsultationSubmission> {
  const { data, error } = await requireSupabase().functions.invoke("consultation-submit", {
    body: {
      name: input.name.trim(),
      corporationNumber: input.corporationNumber.trim(),
      municipalAddress: input.municipalAddress.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      survey: input.survey,
      recaptchaToken: recaptchaToken ?? null,
    },
  });

  const body = data as ({ error?: string } & Partial<ConsultationSubmission>) | null;
  if (error || body?.error) {
    throw new Error(body?.error ?? error?.message ?? "Failed to submit consultation");
  }
  if (!body?.id) {
    throw new Error("Failed to submit consultation");
  }

  return {
    id: body.id as string,
    submittedAt: String(body.submittedAt),
    name: body.name as string,
    corporationNumber: (body.corporationNumber as string) ?? "",
    municipalAddress: (body.municipalAddress as string) ?? "",
    email: body.email as string,
    phone: (body.phone as string) ?? "",
    survey: body.survey as ConsultationSubmission["survey"],
    status: body.status as "new" | "contacted",
    unread: body.unread as boolean,
  };
}

function submitToMock(input: CreateConsultationSubmissionInput): ConsultationSubmission {
  const submission: ConsultationSubmission = {
    id: nextConsultationId(),
    submittedAt: new Date().toISOString(),
    name: input.name.trim(),
    corporationNumber: input.corporationNumber.trim(),
    municipalAddress: input.municipalAddress.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    survey: input.survey,
    status: "new",
    unread: true,
  };
  store.consultationSubmissions = [submission, ...store.consultationSubmissions];
  return submission;
}

export const consultationRepository = {
  async submitConsultation(
    input: CreateConsultationSubmissionInput,
    recaptchaToken?: string | null
  ): Promise<ConsultationSubmission> {
    if (supabase) {
      return submitToSupabase(input, recaptchaToken);
    }
    return submitToMock(input);
  },
};
