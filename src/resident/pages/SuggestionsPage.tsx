import { useEffect, useState } from "react";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { residentRepo } from "../data/residentRepository";
import type { Suggestion } from "../data/types";

type SuggestionsPageProps = {
  onAddNew: () => void;
  refreshKey?: number;
};

export function SuggestionsPage({ onAddNew, refreshKey = 0 }: SuggestionsPageProps) {
  const [items, setItems] = useState<Suggestion[]>([]);

  useEffect(() => {
    residentRepo.getSuggestions().then(setItems);
  }, [refreshKey]);

  if (items.length === 0) {
    return (
      <EmptyState
        title="There are no Suggestions"
        subtitle="Would you like to create a new suggestion?"
        action={
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf]"
          >
            + Add New
          </button>
        }
      />
    );
  }

  return (
    <div className="rounded-sm bg-white/95 p-4 shadow-lg">
      <ModuleMessageBanner moduleId="suggestion" />
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={onAddNew} className="rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white hover:bg-[#2d68cf]">
          + Add New
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded border border-slate-200 p-4 text-sm">
            <p className="text-slate-700">{item.text}</p>
            <p className="mt-2 text-xs text-slate-400">
              {item.createdAt} · {item.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
