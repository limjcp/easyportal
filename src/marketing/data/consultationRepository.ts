import type {
  ConsultationSubmission,
  CreateConsultationSubmissionInput,
} from "../../resident/data/types";
import { supabase } from "../../lib/supabaseClient";
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
  input: CreateConsultationSubmissionInput
): Promise<ConsultationSubmission> {
  const { data, error } = await supabase!
    .from("consultation_submissions")
    .insert({
      name: input.name.trim(),
      corporation_number: input.corporationNumber.trim(),
      municipal_address: input.municipalAddress.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      survey: input.survey,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to submit consultation");
  }

  return mapRow(data as Record<string, unknown>);
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
  async submitConsultation(input: CreateConsultationSubmissionInput): Promise<ConsultationSubmission> {
    if (supabase) {
      return submitToSupabase(input);
    }
    return submitToMock(input);
  },
};
