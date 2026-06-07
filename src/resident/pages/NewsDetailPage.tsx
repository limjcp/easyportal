import { useEffect, useState } from "react";
import { FaPaperclip } from "react-icons/fa";
import { residentRepo } from "../data/mockRepository";
import type { NewsItem } from "../data/types";

export function NewsDetailPage({ id }: { id: string }) {
  const [item, setItem] = useState<NewsItem | null>(null);

  useEffect(() => {
    residentRepo.getNewsById(id).then(setItem);
  }, [id]);

  if (!item) return <div className="rounded-sm bg-white p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="overflow-hidden rounded-sm bg-white shadow-lg">
      <div className="bg-slate-600 px-4 py-2 text-sm text-white">{item.date}</div>
      <div className="bg-[#3476ef] px-4 py-3 text-lg font-semibold text-white">{item.title}</div>
      {item.imageUrl && (
        <img src={item.imageUrl} alt={item.title} className="w-full max-h-80 object-cover" />
      )}
      <div className="whitespace-pre-wrap px-6 py-6 text-sm leading-relaxed text-slate-700">{item.body}</div>
      {item.attachmentUrl && item.attachmentName && (
        <>
          <div className="bg-[#3476ef] px-4 py-2 text-sm font-medium text-white">Attachment:</div>
          <div className="px-6 py-4">
            <a
              href={item.attachmentUrl}
              download={item.attachmentName}
              className="inline-flex items-center gap-2 text-sm text-[#3476ef] hover:underline"
            >
              <FaPaperclip />
              {item.attachmentName}
            </a>
          </div>
        </>
      )}
    </div>
  );
}
