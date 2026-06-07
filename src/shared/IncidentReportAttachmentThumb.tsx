import { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import type { IncidentReportAttachment } from "../resident/data/types";

type IncidentReportAttachmentThumbProps = {
  attachment: IncidentReportAttachment;
  onRemove?: () => void;
};

export function IncidentReportAttachmentThumb({
  attachment,
  onRemove,
}: IncidentReportAttachmentThumbProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewUrl = attachment.previewUrl;

  return (
    <>
      <div className="text-center">
        <div className="group relative mx-auto inline-block overflow-hidden rounded border border-slate-200 bg-slate-50">
          {previewUrl && attachment.kind === "image" ? (
            <img src={previewUrl} alt={attachment.fileName} className="h-24 w-28 object-cover" />
          ) : (
            <div className="flex h-24 w-28 items-center justify-center text-xs text-slate-500">
              {attachment.kind === "pdf" ? "PDF" : "File"}
            </div>
          )}
          {previewUrl ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="rounded border border-white/80 bg-white/90 px-2 py-1 text-slate-700"
                aria-label={`View ${attachment.fileName}`}
              >
                <FaSearch />
              </button>
            </div>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-slate-800">
          {attachment.fileName}
          <br />
          {attachment.uploadedBy} - {attachment.uploadedDate}
        </p>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="mt-1 text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        ) : null}
      </div>

      {previewOpen && previewUrl ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewOpen(false)}
          role="presentation"
        >
          <div
            className="relative max-h-[90vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute -right-2 -top-2 rounded-full bg-white p-2 shadow"
              aria-label="Close preview"
            >
              <FaTimes />
            </button>
            {attachment.kind === "pdf" ? (
              <iframe
                src={previewUrl}
                title={attachment.fileName}
                className="h-[85vh] w-[80vw] max-w-4xl rounded border border-white bg-white shadow-lg"
              />
            ) : (
              <img
                src={previewUrl}
                alt={attachment.fileName}
                className="max-h-[85vh] rounded border border-white shadow-lg"
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function IncidentReportAttachmentGrid({
  attachments,
  onRemove,
}: {
  attachments: IncidentReportAttachment[];
  onRemove?: (attachmentId: string) => void;
}) {
  if (attachments.length === 0) {
    return <p className="text-sm text-slate-500">No files attached.</p>;
  }

  return (
    <div className="flex flex-wrap gap-4">
      {attachments.map((attachment) => (
        <IncidentReportAttachmentThumb
          key={attachment.id}
          attachment={attachment}
          onRemove={onRemove ? () => onRemove(attachment.id) : undefined}
        />
      ))}
    </div>
  );
}
