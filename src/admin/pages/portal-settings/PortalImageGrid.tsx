import { useCallback, useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import { Modal } from "../../../shared/Modal";
import { ActionButton } from "../../../shared/ActionButton";
import { CrudPanel } from "../../../shared/CrudPanel";
import { FileUploadZone } from "../../../shared/FileUploadZone";
import { FormAlert } from "../../../shared/FormAlert";
import { useAsyncAction } from "../../../shared/useAsyncAction";
import { useLocalList } from "../../../shared/useLocalList";
import { AdminFormPanel } from "../../components/AdminFormPanel";
import { adminRepository } from "../../data/adminRepository";
import type { PortalImage, PortalImageKind } from "../../../resident/data/types";

type PortalImageGridProps = {
  kind: PortalImageKind;
  title: string;
  emptyTitle: string;
  emptyHint: string;
  note?: string;
  refreshKey: number;
};

export function PortalImageGrid({
  kind,
  title,
  emptyTitle,
  emptyHint,
  note,
  refreshKey,
}: PortalImageGridProps) {
  const { data: images, reload, loading } = useLocalList(
    useCallback(() => adminRepository.getPortalImages(kind), [kind]),
    refreshKey
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PortalImage | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setPreviewUrl(null);
    setModalOpen(true);
  };

  const openEdit = (img: PortalImage) => {
    setEditing(img);
    setPreviewUrl(img.url);
    setModalOpen(true);
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const { run: handleSave, loading: saving, error } = useAsyncAction(
    useCallback(async () => {
      if (!previewUrl) return;
      if (editing) {
        await adminRepository.updatePortalImage(editing.id, { url: previewUrl });
      } else {
        await adminRepository.createPortalImage({
          kind,
          url: previewUrl,
          sortOrder: images.length,
        });
      }
      setModalOpen(false);
      await reload();
    }, [previewUrl, editing, kind, images.length, reload]),
    { successMessage: "Image saved." }
  );

  const { run: handleDelete, loading: deleting, error: deleteError } = useAsyncAction(
    useCallback(async () => {
      if (!deleteId) return;
      await adminRepository.deletePortalImage(deleteId);
      setDeleteId(null);
      await reload();
    }, [deleteId, reload]),
    { successMessage: "Image deleted." }
  );

  return (
    <CrudPanel loading={loading}>
      <AdminFormPanel
      title={`${images.length} ${title}`}
      headerColor="primary"
      toolbar={
        <button
          type="button"
          onClick={openAdd}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
        >
          <FaPlus className="mr-1 inline" />
          Add New
        </button>
      }
    >
      {note && <p className="mb-4 text-sm text-slate-600">{note}</p>}
      {images.length === 0 ? (
        <div className="py-8 text-center text-slate-500">
          <p className="font-semibold">{emptyTitle}</p>
          <p className="mt-1 text-sm">{emptyHint}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`overflow-hidden rounded border bg-white shadow-sm ${idx === 0 && kind === "resident" ? "ring-2 ring-[#3476ef]" : ""}`}
            >
              <div className="relative aspect-[3/2]">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition hover:opacity-100">
                  <button type="button" onClick={() => window.open(img.url, "_blank")} className="rounded bg-white/90 p-2 text-slate-700">
                    <FaSearch />
                  </button>
                  <button type="button" onClick={() => openEdit(img)} className="rounded bg-teal-600 p-2 text-white">
                    <FaEdit />
                  </button>
                  <button type="button" onClick={() => setDeleteId(img.id)} className="rounded bg-white/90 p-2 text-slate-700">
                    <FaTrash />
                  </button>
                </div>
              </div>
              {idx === 0 && kind === "resident" && (
                <p className="px-2 py-1 text-center text-xs text-[#3476ef]">Primary background</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Image" : "Add Image"}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded border px-4 py-2 text-sm">
              Cancel
            </button>
            <ActionButton
              label="Save"
              loadingLabel="Saving…"
              loading={saving}
              disabled={!previewUrl}
              onClick={() => void handleSave()}
            />
          </div>
        }
      >
        {error ? <FormAlert message={error} className="mb-3" /> : null}
        {previewUrl && <img src={previewUrl} alt="" className="mb-3 max-h-40 rounded border object-cover" />}
        <FileUploadZone onFileSelect={handleFile} onRemove={previewUrl ? () => setPreviewUrl(null) : undefined} />
        <p className="mt-2 text-xs text-slate-500">Mock upload — optimize images for faster loading.</p>
      </Modal>

      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Image"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteId(null)} className="rounded border px-4 py-2 text-sm">
              Cancel
            </button>
            <ActionButton
              label="Delete"
              loadingLabel="Deleting…"
              loading={deleting}
              variant="danger"
              onClick={() => void handleDelete()}
            />
          </div>
        }
      >
        {deleteError ? <FormAlert message={deleteError} className="mb-3" /> : null}
        <p className="text-sm text-slate-600">Are you sure you want to delete this image?</p>
      </Modal>
    </AdminFormPanel>
    </CrudPanel>
  );
}
