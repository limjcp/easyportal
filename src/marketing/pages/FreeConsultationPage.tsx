import { useMemo, useState } from "react";
import { MarketingContentPage } from "./MarketingContentPage";
import { freeConsultationPageContent } from "../data/pageContent/freeConsultation";
import { SectionBlock } from "../components/SectionBlock";
import { consultationRepository } from "../data/consultationRepository";
import type {
  ConsultationChangeIntent,
  ConsultationCondoHealth,
  ConsultationManagementExperience,
  CreateConsultationSubmissionInput,
} from "../../resident/data/types";

type FreeConsultationPageProps = {
  onNavigate: (path: string) => void;
};

type IntakeStep =
  | {
      id: "condoHealth" | "managementExperience" | "consideringManagementChange";
      type: "choice";
      prompt: string;
      options: { value: string; label: string }[];
    }
  | {
      id: "currentPainPoint" | "name" | "corporationNumber" | "municipalAddress" | "email" | "phone";
      type: "text";
      prompt: string;
      placeholder: string;
      inputType?: "text" | "email" | "tel";
      multiline?: boolean;
    };

type IntakeFormState = {
  condoHealth: ConsultationCondoHealth | "";
  managementExperience: ConsultationManagementExperience | "";
  consideringManagementChange: ConsultationChangeIntent | "";
  currentPainPoint: string;
  name: string;
  corporationNumber: string;
  municipalAddress: string;
  email: string;
  phone: string;
};

const INTAKE_STEPS: IntakeStep[] = [
  {
    id: "condoHealth",
    type: "choice",
    prompt: "How is your condo community doing right now?",
    options: [
      { value: "excellent", label: "Excellent" },
      { value: "good", label: "Good" },
      { value: "fair", label: "Fair" },
      { value: "poor", label: "Poor" },
    ],
  },
  {
    id: "managementExperience",
    type: "choice",
    prompt: "How would you rate your current management experience?",
    options: [
      { value: "very-good", label: "Very Good" },
      { value: "good", label: "Good" },
      { value: "needs-improvement", label: "Needs Improvement" },
      { value: "poor", label: "Poor" },
    ],
  },
  {
    id: "consideringManagementChange",
    type: "choice",
    prompt: "Are you considering a management change?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not-sure", label: "Not Sure Yet" },
    ],
  },
  {
    id: "currentPainPoint",
    type: "text",
    multiline: true,
    prompt: "What is your biggest issue with your current condo operations?",
    placeholder: "Tell us what is currently not working well...",
  },
  {
    id: "name",
    type: "text",
    prompt: "What is your name?",
    placeholder: "Full name",
  },
  {
    id: "corporationNumber",
    type: "text",
    prompt: "What is your corporation number?",
    placeholder: "Example: WNCC 87",
  },
  {
    id: "municipalAddress",
    type: "text",
    prompt: "What is the municipal address of the condominium?",
    placeholder: "Street address",
  },
  {
    id: "email",
    type: "text",
    inputType: "email",
    prompt: "What email should we use to contact you?",
    placeholder: "name@example.com",
  },
  {
    id: "phone",
    type: "text",
    inputType: "tel",
    prompt: "What phone number should we call?",
    placeholder: "Phone number",
  },
];

export function FreeConsultationPage({ onNavigate }: FreeConsultationPageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [form, setForm] = useState<IntakeFormState>({
    condoHealth: "",
    managementExperience: "",
    consideringManagementChange: "",
    currentPainPoint: "",
    name: "",
    corporationNumber: "",
    municipalAddress: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeStep = INTAKE_STEPS[activeIndex];
  const progress = useMemo(
    () => Math.round(((activeIndex + 1) / INTAKE_STEPS.length) * 100),
    [activeIndex]
  );

  const goNext = async () => {
    if (!activeStep || activeStep.type !== "text") return;
    const value = form[activeStep.id];
    if (!String(value).trim()) {
      setError("Please provide an answer before continuing.");
      return;
    }
    if (activeStep.id === "email" && !String(value).includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    if (activeIndex < INTAKE_STEPS.length - 1) {
      setActiveIndex((i) => i + 1);
      return;
    }

    const payload: CreateConsultationSubmissionInput = {
      name: form.name,
      corporationNumber: form.corporationNumber,
      municipalAddress: form.municipalAddress,
      email: form.email,
      phone: form.phone,
      survey: {
        condoHealth: form.condoHealth as ConsultationCondoHealth,
        managementExperience: form.managementExperience as ConsultationManagementExperience,
        currentPainPoint: form.currentPainPoint,
        consideringManagementChange: form.consideringManagementChange as ConsultationChangeIntent,
      },
    };
    setIsSubmitting(true);
    try {
      await consultationRepository.submitConsultation(payload);
      setIsSubmitted(true);
      setError(null);
    } catch {
      setError("We could not submit right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onChoiceSelect = (value: string) => {
    if (!activeStep || activeStep.type !== "choice") return;
    setForm((prev) => {
      if (activeStep.id === "condoHealth") {
        return { ...prev, condoHealth: value as ConsultationCondoHealth };
      }
      if (activeStep.id === "managementExperience") {
        return { ...prev, managementExperience: value as ConsultationManagementExperience };
      }
      return { ...prev, consideringManagementChange: value as ConsultationChangeIntent };
    });
    setError(null);
    setActiveIndex((i) => Math.min(i + 1, INTAKE_STEPS.length - 1));
  };

  return (
    <div className="space-y-8">
      <MarketingContentPage content={freeConsultationPageContent} onNavigate={onNavigate} />
      <SectionBlock
        title="Interactive Consultation Intake"
        subtitle="Answer one question at a time. Once complete, our team will contact you directly."
      >
        {isSubmitted ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="text-lg font-semibold text-emerald-800">Thank you. Your consultation request is submitted.</h3>
            <p className="mt-2 text-sm text-emerald-900/90">
              We will contact you shortly using the information you provided.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => onNavigate("/contact-us")}
                className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Go to Contact Page
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>
                  Step {activeIndex + 1} of {INTAKE_STEPS.length}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-[#3476ef]" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-900">{activeStep.prompt}</h3>

            {activeStep.type === "choice" ? (
              <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeStep.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChoiceSelect(option.value)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-[#3476ef] hover:text-[#1f4db8]"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={activeIndex === 0}
                    onClick={() => setActiveIndex((i) => Math.max(i - 1, 0))}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {activeStep.multiline ? (
                  <textarea
                    value={form[activeStep.id]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [activeStep.id]: e.target.value }))}
                    placeholder={activeStep.placeholder}
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#3476ef]"
                  />
                ) : (
                  <input
                    type={activeStep.inputType ?? "text"}
                    value={form[activeStep.id]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [activeStep.id]: e.target.value }))}
                    placeholder={activeStep.placeholder}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#3476ef]"
                  />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={activeIndex === 0 || isSubmitting}
                    onClick={() => setActiveIndex((i) => Math.max(i - 1, 0))}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={goNext}
                    className="rounded-full bg-[#3476ef] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d68cf] disabled:opacity-50"
                  >
                    {activeIndex === INTAKE_STEPS.length - 1 ? (isSubmitting ? "Submitting..." : "Submit") : "Next"}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>
        )}
      </SectionBlock>
    </div>
  );
}

