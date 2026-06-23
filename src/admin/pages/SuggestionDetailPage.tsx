import { useCallback, useEffect, useRef, useState } from "react";
import { FaPrint } from "react-icons/fa";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { usePageContentBusy } from "../../shared/usePageContentBusy";
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
  const pendingCommentRef = useRef<{ text: string; kind: "admin" | "public" } | null>(null);

  const refresh = useCallback(async () => {
    const updated = await adminRepository.getSuggestionById(route.id);
    if (updated) setSuggestion(updated);
  }, [route.id]);

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

  const { run: save, loading: saving, error: saveError } = useAsyncAction(
    useCallback(async () => {
      await adminRepository.updateSuggestion(route.id, { text, visibility });
      await refresh();
    }, [route.id, text, visibility, refresh]),
    { successMessage: "Suggestion saved.", showErrorToast: false }
  );

  const { run: setUnread, loading: markingUnread } = useAsyncAction(
    useCallback(async () => {
      await adminRepository.updateSuggestion(route.id, { unread: true });
      await refresh();
    }, [route.id, refresh]),
    { successMessage: "Marked as unread.", showErrorToast: false }
  );

  const { run: addCommentRun, error: commentError } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingCommentRef.current;
      if (!pending) return;
      await adminRepository.addSuggestionComment(
        route.id,
        {
          author: pending.kind === "admin" ? "Scott Hundey" : "Scott Munday",
          text: pending.text,
          createdAt: new Date().toLocaleString(),
        },
        pending.kind
      );
      await refresh();
    }, [route.id, refresh]),
    { successMessage: "Comment added.", showErrorToast: false }
  );

  const addComment = (commentText: string, kind: "admin" | "public") => {
    pendingCommentRef.current = { text: commentText, kind };
    void addCommentRun();
  };

  usePageContentBusy(!suggestion);

  if (!suggestion) {
    return null;
  }

  const formError = saveError ?? commentError;

  return (
    <>
      <AdminPageActions route={route} onNavigate={onNavigate} />

      <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
        <AdminPanelHeader title="Suggestion" color="green" />

        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_280px]">
          {formError ? <FormAlert message={formError} className="lg:col-span-2" /> : null}
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
            onAdd={(commentText) => addComment(commentText, "admin")}
          />

          <CommentSection
            title="Scrollable Comments"
            subtitle="(Visible to Resident & Admin)"
            comments={suggestion.publicComments}
            headerColor="gray"
            onAdd={(commentText) => addComment(commentText, "public")}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <ActionButton
            label="Set as Unread"
            variant="secondary"
            className="bg-slate-800 text-white hover:bg-slate-900"
            loading={markingUnread}
            loadingLabel="Updating…"
            onClick={() => void setUnread()}
          />
          <ActionButton
            label="Save Changes"
            variant="success"
            loading={saving}
            loadingLabel="Saving…"
            onClick={() => void save()}
          />
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
