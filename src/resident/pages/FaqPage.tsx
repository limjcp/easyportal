import { useEffect, useState } from "react";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { residentRepo } from "../data/mockRepository";
import type { FaqItem } from "../data/types";

export function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  useEffect(() => {
    residentRepo.getFaqs().then(setFaqs);
  }, []);

  if (faqs.length === 0) {
    return (
      <div className="rounded-sm bg-white px-6 py-4 text-center text-slate-600 shadow-sm">
        No FAQs
      </div>
    );
  }

  return (
    <div>
      <ModuleMessageBanner moduleId="faq" />
      <div className="space-y-3">
      {faqs.map((faq) => (
        <details key={faq.id} className="rounded-sm bg-white p-4 shadow-sm">
          <summary className="cursor-pointer font-medium text-slate-800">{faq.question}</summary>
          <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
        </details>
      ))}
      </div>
    </div>
  );
}
