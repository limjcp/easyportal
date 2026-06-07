import { useMemo, useState } from "react";
import { consultationRepository } from "../../data/consultationRepository";
import { pe } from "../../typography";
import { ArrowUpRightIcon } from "../icons";
import { EditorialSectionHeader } from "./EditorialSectionHeader";
import type {
  ConsultationChangeIntent,
  ConsultationCondoHealth,
  ConsultationCondoType,
  ConsultationManagementExperience,
  ConsultationRegion,
  ConsultationTopConcern,
  ConsultationUnitCount,
  ConsultationYourRole,
  CreateConsultationSubmissionInput,
} from "../../../resident/data/types";

type ConsultationIntakeSectionProps = {
  onNavigate: (path: string) => void;
};

type ChoiceStepId =
  | "condoType"
  | "unitCount"
  | "yourRole"
  | "region"
  | "condoHealth"
  | "managementExperience"
  | "topConcern"
  | "consideringManagementChange";

type IntakeStep =
  | {
      id: ChoiceStepId;
      type: "choice";
      prompt: string;
      options: { value: string; label: string }[];
    }
  | {
      id: "contact";
      type: "contact";
      prompt: string;
    };

type IntakeFormState = {
  condoType: ConsultationCondoType | "";
  unitCount: ConsultationUnitCount | "";
  yourRole: ConsultationYourRole | "";
  region: ConsultationRegion | "";
  condoHealth: ConsultationCondoHealth | "";
  managementExperience: ConsultationManagementExperience | "";
  topConcern: ConsultationTopConcern | "";
  consideringManagementChange: ConsultationChangeIntent | "";
  name: string;
  email: string;
  phone: string;
};

const INTAKE_STEPS: IntakeStep[] = [
  {
    id: "condoType",
    type: "choice",
    prompt: "What type of condominium are you?",
    options: [
      { value: "high-rise", label: "High-rise" },
      { value: "townhouse", label: "Townhouse" },
      { value: "mixed-use", label: "Mixed-use" },
      { value: "commercial-residential", label: "Commercial / residential" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "unitCount",
    type: "choice",
    prompt: "How many units are in your corporation?",
    options: [
      { value: "under-50", label: "Under 50" },
      { value: "50-100", label: "50–100" },
      { value: "100-250", label: "100–250" },
      { value: "250-plus", label: "250+" },
    ],
  },
  {
    id: "yourRole",
    type: "choice",
    prompt: "What is your role?",
    options: [
      { value: "board-president", label: "Board president" },
      { value: "board-director", label: "Board director" },
      { value: "treasurer", label: "Treasurer" },
      { value: "owner", label: "Owner" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "region",
    type: "choice",
    prompt: "Where is your building located?",
    options: [
      { value: "gta", label: "Greater Toronto Area" },
      { value: "kitchener-waterloo", label: "Kitchener–Waterloo" },
      { value: "southwestern-ontario", label: "Southwestern Ontario" },
      { value: "other-ontario", label: "Other Ontario" },
    ],
  },
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
      { value: "very-good", label: "Very good" },
      { value: "good", label: "Good" },
      { value: "needs-improvement", label: "Needs improvement" },
      { value: "poor", label: "Poor" },
    ],
  },
  {
    id: "topConcern",
    type: "choice",
    prompt: "What is your biggest concern right now?",
    options: [
      { value: "communication", label: "Communication" },
      { value: "financial-reporting", label: "Financial reporting" },
      { value: "vendor-execution", label: "Vendor execution" },
      { value: "compliance", label: "Compliance" },
      { value: "fees", label: "Fees" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "consideringManagementChange",
    type: "choice",
    prompt: "Are you considering a management change?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not-sure", label: "Not sure yet" },
    ],
  },
  {
    id: "contact",
    type: "contact",
    prompt: "How should we reach you with your second opinion?",
  },
];

const inputClassName =
  "w-full border-0 border-b border-border bg-transparent px-0 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-foreground transition-colors duration-300";

const emptyForm = (): IntakeFormState => ({
  condoType: "",
  unitCount: "",
  yourRole: "",
  region: "",
  condoHealth: "",
  managementExperience: "",
  topConcern: "",
  consideringManagementChange: "",
  name: "",
  email: "",
  phone: "",
});

export function ConsultationIntakeSection({ onNavigate }: ConsultationIntakeSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [form, setForm] = useState<IntakeFormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeStep = INTAKE_STEPS[activeIndex];
  const progress = useMemo(
    () => Math.round(((activeIndex + 1) / INTAKE_STEPS.length) * 100),
    [activeIndex]
  );

  const submitForm = async () => {
    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);

    const payload: CreateConsultationSubmissionInput = {
      name: form.name.trim(),
      corporationNumber: "",
      municipalAddress: "",
      email: form.email.trim(),
      phone: form.phone.trim(),
      survey: {
        condoType: form.condoType as ConsultationCondoType,
        unitCount: form.unitCount as ConsultationUnitCount,
        yourRole: form.yourRole as ConsultationYourRole,
        region: form.region as ConsultationRegion,
        condoHealth: form.condoHealth as ConsultationCondoHealth,
        managementExperience: form.managementExperience as ConsultationManagementExperience,
        topConcern: form.topConcern as ConsultationTopConcern,
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
    setForm((prev) => ({ ...prev, [activeStep.id]: value }));
    setError(null);
    setActiveIndex((i) => Math.min(i + 1, INTAKE_STEPS.length - 1));
  };

  const goBack = () => {
    setError(null);
    setActiveIndex((i) => Math.max(i - 1, 0));
  };

  return (
    <section className="px-6 py-28 md:px-12 lg:px-20 md:py-36 border-t border-border">
      <EditorialSectionHeader
        eyebrow="Answer a few quick questions. Once complete, our team will follow up with a free second opinion."
        title="Free Condo Second Opinion"
        count={`(${String(INTAKE_STEPS.length).padStart(2, "0")}) Steps`}
      />

      {isSubmitted ? (
        <div className="max-w-2xl border border-border p-8 md:p-12">
          <p className={`${pe.eyebrow} text-muted-foreground mb-6`}>Submitted</p>
          <h3 className={`${pe.cardTitleLg} text-foreground`}>
            Thank you. Your second opinion request is submitted.
          </h3>
          <p className={`mt-4 ${pe.bodySm} text-muted-foreground`}>
            We will contact you shortly using the information you provided.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("/contact-us")}
            className={`group mt-8 inline-flex items-center gap-3 ${pe.linkAction} text-foreground hover:text-muted-foreground transition-colors duration-500`}
          >
            <span className="border-b border-foreground/20 pb-0.5 group-hover:border-foreground/60 transition-colors duration-500">
              Go to Contact Page
            </span>
            <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
          </button>
        </div>
      ) : (
        <div className="max-w-2xl">
          <div className="mb-10">
            <div className={`mb-3 flex items-center justify-between ${pe.eyebrowSm} text-muted-foreground`}>
              <span>
                Step {activeIndex + 1} of {INTAKE_STEPS.length}
              </span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="h-px bg-border">
              <div className="h-px bg-foreground transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <h3 className={`${pe.cardTitleLg} text-foreground`}>{activeStep.prompt}</h3>

          {activeStep.type === "choice" ? (
            <div className="mt-8 space-y-3">
              <div className="divide-y divide-border border-t border-b border-border">
                {activeStep.options.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChoiceSelect(option.value)}
                    className="group flex w-full items-center justify-between py-5 text-left transition-colors duration-300 hover:text-muted-foreground"
                  >
                    <div className="flex items-center gap-6">
                      <span className={`${pe.eyebrowSm} text-muted-foreground/50 tabular-nums w-8`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={`${pe.listTitle} text-foreground`}>{option.label}</span>
                    </div>
                    <ArrowUpRightIcon className={`${pe.iconSm} text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300`} />
                  </button>
                ))}
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  disabled={activeIndex === 0}
                  onClick={goBack}
                  className={`${pe.eyebrowSm} text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors duration-300`}
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
                className={inputClassName}
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email address"
                className={inputClassName}
              />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number (optional)"
                className={inputClassName}
              />
              <div className="flex items-center gap-8 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={goBack}
                  className={`${pe.eyebrowSm} text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors duration-300`}
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={submitForm}
                  className={`group inline-flex items-center gap-3 ${pe.linkAction} text-foreground hover:text-muted-foreground disabled:opacity-40 transition-colors duration-500`}
                >
                  <span className="border-b border-foreground/20 pb-0.5 group-hover:border-foreground/60 transition-colors duration-500">
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </span>
                  <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
                </button>
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </section>
  );
}
