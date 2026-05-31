import { useState } from "react";
import type { Comment } from "../../resident/data/types";

type CommentSectionProps = {
  title: string;
  subtitle?: string;
  comments: Comment[];
  adminOnly?: boolean;
  onAdd: (text: string) => void;
  headerColor?: "green" | "gray" | "orange";
};

export function CommentSection({
  title,
  subtitle,
  comments,
  adminOnly,
  onAdd,
  headerColor = "orange",
}: CommentSectionProps) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  const colors = {
    green: "bg-[#89c64c]",
    gray: "bg-slate-500",
    orange: "bg-[#e8913a]",
  };

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
    setAdding(false);
  };

  return (
    <div className="mt-4 overflow-hidden rounded-sm border border-slate-300">
      <div className={`flex items-center justify-between px-3 py-2 text-sm font-medium text-white ${colors[headerColor]}`}>
        <span>
          {title}
          {subtitle && <span className="ml-1 text-xs font-normal opacity-90">{subtitle}</span>}
        </span>
        <button
          type="button"
          onClick={() => setAdding(!adding)}
          className="rounded bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30"
        >
          + Add
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto bg-white p-3 text-sm">
        {adding && (
          <div className="mb-3 space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full rounded border border-slate-300 px-3 py-2"
              placeholder="Enter comment..."
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                className="rounded bg-[#3476ef] px-3 py-1 text-xs text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded border border-slate-300 px-3 py-1 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {comments.length === 0 ? (
          <p className="text-slate-500">No Comments</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="border-b border-slate-100 pb-2 last:border-0">
                <p className="text-xs text-slate-500">
                  {c.createdAt}: {c.author}
                </p>
                <p className="mt-1 text-slate-700">{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminSectionHeader({
  title,
  action,
  color = "orange",
}: {
  title: string;
  action?: React.ReactNode;
  color?: "orange" | "blue";
}) {
  const bg = color === "orange" ? "bg-[#e8913a]" : "bg-[#3476ef]";
  return (
    <div className={`flex items-center justify-between px-3 py-2 text-sm font-medium text-white ${bg}`}>
      <span>{title}</span>
      {action}
    </div>
  );
}
