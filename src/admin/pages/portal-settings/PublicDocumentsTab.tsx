import { useCallback, useEffect, useState } from "react";
import { FaFile, FaFolderOpen, FaTrash } from "react-icons/fa";
import { Modal } from "../../../shared/Modal";
import { ActionButton } from "../../../shared/ActionButton";
import { FileUploadZone } from "../../../shared/FileUploadZone";
import { FormAlert } from "../../../shared/FormAlert";
import { useAsyncAction } from "../../../shared/useAsyncAction";
import { adminRepository } from "../../data/adminRepository";
import type { PublicPortalDocument } from "../../../resident/data/types";
import { PortalSettingsAlert } from "./PortalSettingsAlert";

export function PublicDocumentsTab() {
  const [docs, setDocs] = useState<PublicPortalDocument[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");

  const load = () => adminRepository.getPublicPortalDocuments().then(setDocs);

  useEffect(() => {
    load();
  }, []);

  const { run: handleUpload, loading: uploading, error } = useAsyncAction(
    useCallback(async () => {
      await adminRepository.createPublicPortalDocument({
        title: title || "Uploaded Document",
        filename: "public_document.pdf",
        uploadedAt: new Date().toLocaleDateString(),
      });
      setTitle("");
      setUploadOpen(false);
      load();
    }, [title]),
    { successMessage: "Document uploaded." }
  );

  return (
    <div className="space-y-4">
      <PortalSettingsAlert title="Public Portal Documents" icon={<FaFile />}>
        <p>
          These documents will be available to any user visiting the home/login page of your resident portal.
          <br />
          <br />
          This is a great place to add downloadable files such as floor plans, application forms, bylaws, policies, rules,
          or any other documents you wish to be made publicly available.
        </p>
      </PortalSettingsAlert>

      <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
          <h3 className="text-sm font-semibold text-slate-700">Website Home Page Documents</h3>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="rounded border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-50"
          >
            Upload Document
          </button>
        </div>
        {docs.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <FaFolderOpen className="mx-auto mb-2 text-4xl text-slate-300" />
            <p className="font-semibold">No documents found</p>
            <p className="mt-1 text-sm">Upload a document to make it available on the public login page.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">File</th>
                <th className="px-4 py-2">Uploaded</th>
                <th className="px-4 py-2 w-16" />
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{d.title}</td>
                  <td className="px-4 py-2">{d.filename}</td>
                  <td className="px-4 py-2">{d.uploadedAt}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => adminRepository.deletePublicPortalDocument(d.id).then(load)}
                      className="text-red-600 hover:text-red-800"
                      aria-label="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Public Portal Document"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setUploadOpen(false)} className="rounded border px-4 py-2 text-sm">
              Cancel
            </button>
            <ActionButton
              label="Upload"
              loadingLabel="Uploading…"
              loading={uploading}
              onClick={() => void handleUpload()}
            />
          </div>
        }
      >
        {error ? <FormAlert message={error} className="mb-3" /> : null}
        <label className="block text-sm">
          <span className="font-medium">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="mt-3">
          <FileUploadZone />
        </div>
        <p className="mt-2 text-xs text-slate-500">Mock upload — separate from admin Documents module.</p>
      </Modal>
    </div>
  );
}
