import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FileUploadZone } from "../../shared/FileUploadZone";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { residentRepo } from "../data/residentRepository";
import type { DocumentFolder } from "../data/types";

type ResidentUploadDocumentModalProps = {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
};

export function ResidentUploadDocumentModal({ open, onClose, onUploaded }: ResidentUploadDocumentModalProps) {
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [folderId, setFolderId] = useState("");
  const [title, setTitle] = useState("");
  const fileRef = useRef<File | null>(null);

  useEffect(() => {
    if (!open) return;
    residentRepo.getDocumentFolders().then((list) => {
      setFolders(list);
      setFolderId(list[0]?.id ?? "");
    });
    setTitle("");
    fileRef.current = null;
  }, [open]);

  const { run: submitUpload, loading, error } = useAsyncAction(
    useCallback(async () => {
      const file = fileRef.current;
      if (!file) throw new Error("Please choose a file to upload.");
      if (!folderId) throw new Error("Please select a folder.");
      await residentRepo.createDocument(file, { folderId, title: title.trim() || file.name });
      onUploaded();
      onClose();
    }, [folderId, onClose, onUploaded, title]),
    { successMessage: "Document uploaded." }
  );

  return (
    <Modal
      open={open}
      onClose={() => {
        if (loading) return;
        onClose();
      }}
      title="Upload Document"
      size="md"
      footer={
        <div className="flex w-full justify-end gap-2">
          <ActionButton label="Cancel" variant="secondary" onClick={onClose} disabled={loading} />
          <ActionButton label="Upload" loading={loading} onClick={() => void submitUpload()} />
        </div>
      }
    >
      {error ? <FormAlert message={error} className="mb-3" /> : null}
      {folders.length === 0 ? (
        <p className="text-sm text-slate-600">No document folders are available yet.</p>
      ) : (
        <div className="space-y-4">
          <label className="block text-sm text-slate-700">
            <span className="font-medium">Folder</span>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm"
            >
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-700">
            <span className="font-medium">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm"
            />
          </label>
          <FileUploadZone onFileSelect={(file) => { fileRef.current = file; }} onRemove={() => { fileRef.current = null; }} />
        </div>
      )}
    </Modal>
  );
}
