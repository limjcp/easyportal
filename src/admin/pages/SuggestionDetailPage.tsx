import { useEffect, useState } from "react";
import { FaPrint } from "react-icons/fa";
import { AdminPanelHeader } from "../components/AdminPanelTable";
import { CommentSection } from "../components/CommentSection";
import { adminRepository } from "../data/adminRepository";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type { AdminSuggestion } from "../../resident/data/types";

type SuggestionDetailPageProps = {
  route: AdminRoute & { page: "suggestion-detail" };
  onNavigate: (route: AdminRoute) => void;
};

export function SuggestionDetailPage({ route, onNavigate }: SuggestionDetailPageProps) {
  const [suggestion, setSuggestion] = useState<AdminSuggestion | null>(null);
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState("");

  useEffect(() => {
    adminRepository.getSuggestionById(route.id).then((s) => {
      if (s) {
        setSuggestion(s);
        setText(s.text);
        setVisibility(s.visibility);
        if (s.unread) {
          adminRepository.updateSuggestion(s.id, { unread: false });
        }
      }
    });
  }, [route.id]);

  if (!suggestion) {
    return <div className="py-8 text-center text-slate-500">Loading...</div>;
  }

  const refresh = async () => {
    const updated = await adminRepository.getSuggestionById(route.id);
    if (updated) setSuggestion(updated);
  };

  const save = async () => {
    await adminRepository.updateSuggestion(route.id, { text, visibility });
    refresh();
  };

  return (
    <>
      <AdminPageActions route={route} onNavigate={onNavigate} />

      <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
        <AdminPanelHeader title="Suggestion" color="green" />

        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <label className="block text-sm">
              Visibility
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="mt-1 w-full max-w-md rounded border border-slate-300 px-3 py-1.5"
              >
                <option>Private (Admin & Author)</option>
                <option>Private</option>
                <option>Public</option>
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Created Date</p>
                <p className="text-sm">{suggestion.createdAt}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Created By</p>
                <p className="text-sm">
                  {suggestion.createdBy} Unit: {suggestion.unit}
                </p>
              </div>
            </div>
            <label className="block text-sm">
              Description
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <div className="rounded border border-slate-200 p-3">
            <p className="text-sm font-medium text-slate-700">Original Attachments</p>
            <p className="mt-2 text-sm text-slate-500">
              {suggestion.attachments.length === 0 ? "No attachments" : suggestion.attachments.join(", ")}
            </p>
          </div>
        </div>

        <div className="px-4 pb-4">
          <CommentSection
            title="Scrollable Admin Comments"
            subtitle="(Visible to Admin ONLY)"
            comments={suggestion.adminComments}
            headerColor="green"
            onAdd={(commentText) =>
              adminRepository
                .addSuggestionComment(
                  route.id,
                  { author: "Scott Hundey", text: commentText, createdAt: new Date().toLocaleString() },
                  "admin"
                )
                .then(refresh)
            }
          />

          <CommentSection
            title="Scrollable Comments"
            subtitle="(Visible to Resident & Admin)"
            comments={suggestion.publicComments}
            headerColor="gray"
            onAdd={(commentText) =>
              adminRepository
                .addSuggestionComment(
                  route.id,
                  { author: "Scott Munday", text: commentText, createdAt: new Date().toLocaleString() },
                  "public"
                )
                .then(refresh)
            }
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={() => adminRepository.updateSuggestion(route.id, { unread: true }).then(refresh)}
            className="rounded bg-slate-800 px-4 py-2 text-sm text-white"
          >
            Set as Unread
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded bg-[#89c64c] px-4 py-2 text-sm text-white"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded bg-[#79d0df] px-4 py-2 text-sm text-white"
          >
            <FaPrint />
            Print
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ page: "suggestions" })}
            className="rounded border border-slate-300 px-4 py-2 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
