import type {
  ConsultationSubmission,
  CreateConsultationSubmissionInput,
} from "../../resident/data/types";
import { store } from "../../resident/data/sharedStore";

const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 120));

const nextConsultationId = () => `consult-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const consultationRepository = {
  async submitConsultation(input: CreateConsultationSubmissionInput): Promise<ConsultationSubmission> {
    const submission: ConsultationSubmission = {
      id: nextConsultationId(),
      submittedAt: new Date().toISOString(),
      name: input.name.trim(),
      corporationNumber: input.corporationNumber.trim(),
      municipalAddress: input.municipalAddress.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      survey: {
        condoHealth: input.survey.condoHealth,
        managementExperience: input.survey.managementExperience,
        currentPainPoint: input.survey.currentPainPoint.trim(),
        consideringManagementChange: input.survey.consideringManagementChange,
      },
      status: "new",
      unread: true,
    };
    store.consultationSubmissions = [submission, ...store.consultationSubmissions];
    return delay(submission);
  },
};

