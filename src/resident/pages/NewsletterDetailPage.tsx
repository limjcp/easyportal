import { useEffect, useState } from "react";
import { FaPaperclip } from "react-icons/fa";
import { residentRepo } from "../data/mockRepository";
import type { Newsletter } from "../data/types";
import type { ResidentRoute } from "../navigation";

export function NewsletterDetailPage({
  id,
  onNavigate,
}: {
  id: string;
  onNavigate: (route: ResidentRoute) => void;
}) {
  const [item, setItem] = useState<Newsletter | null>(null);

  useEffect(() => {
    residentRepo.getNewsletterById(id).then(setItem);
  }, [id]);

  if (!item) return <div className="rounded-sm bg-white p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-sm border border-slate-200 bg-white shadow-lg">
      <div className="bg-slate-600 px-4 py-2 text-sm text-white">
        {new Date(item.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) || item.date}
      </div>
      <div className="bg-[#3476ef] px-4 py-3 text-lg font-semibold text-white">{item.title}</div>
      <div className="whitespace-pre-wrap px-6 py-6 text-sm leading-relaxed text-slate-700">{item.body}</div>
      {item.attachmentName && (
        <>
          <div className="bg-[#3476ef] px-4 py-2 text-sm font-medium text-white">Attachment:</div>
          <div className="px-6 py-4">
            <a href="#" className="inline-flex items-center gap-2 text-sm text-[#3476ef] hover:underline">
              <FaPaperclip />
              {item.attachmentName}
            </a>
          </div>
        </>
      )}
      <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-4 py-3">
        <button
          type="button"
          onClick={() => onNavigate({ page: "newsletters" })}
          className="rounded border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}
