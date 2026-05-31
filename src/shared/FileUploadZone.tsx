import { useRef } from "react";
import { FaFolderOpen, FaTimes } from "react-icons/fa";

type FileUploadZoneProps = {
  label?: string;
  onFileSelect?: (file: File | null) => void;
  onRemove?: () => void;
};

export function FileUploadZone({ onFileSelect, onRemove }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 rounded p-0.5 text-slate-400 hover:text-slate-600"
          aria-label="Remove"
        >
          <FaTimes className="text-xs" />
        </button>
      )}
      <p className="text-xs text-slate-500">Drag & drop files here...</p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => onFileSelect?.(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-2 inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
      >
        <FaFolderOpen />
        Browse
      </button>
    </div>
  );
}
