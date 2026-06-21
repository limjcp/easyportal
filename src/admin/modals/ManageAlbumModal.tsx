import { useCallback, useEffect, useRef, useState } from "react";
import { FaImage, FaTrash } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { FileUploadZone } from "../../shared/FileUploadZone";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { adminRepository } from "../data/adminRepository";
import type { GalleryAlbum, GalleryPhoto } from "../../resident/data/types";

type ManageAlbumModalProps = {
  open: boolean;
  album: GalleryAlbum | null;
  onClose: () => void;
  onUpdated: () => void;
};

export function ManageAlbumModal({ open, album, onClose, onUpdated }: ManageAlbumModalProps) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pendingPhotoIdRef = useRef<string | null>(null);
  const pendingFilesRef = useRef<File[]>([]);

  const loadPhotos = useCallback(async () => {
    if (!album) {
      setPhotos([]);
      return;
    }
    setLoadError(null);
    try {
      const items = await adminRepository.getGalleryPhotos(album.id);
      setPhotos(items);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load photos.");
      setPhotos([]);
    }
  }, [album]);

  useEffect(() => {
    if (!open || !album) return;
    void loadPhotos();
  }, [open, album, loadPhotos]);

  const { run: uploadPhotos, loading: uploading, error: uploadError } = useAsyncAction(
    useCallback(async () => {
      if (!album) return;
      const files = pendingFilesRef.current;
      if (files.length === 0) return;
      for (const file of files) {
        await adminRepository.addGalleryPhoto(album.id, file);
      }
      pendingFilesRef.current = [];
      await loadPhotos();
      onUpdated();
    }, [album, loadPhotos, onUpdated]),
    { successMessage: "Photos uploaded." }
  );

  const { run: deletePhoto, loading: deleting, error: deleteError } = useAsyncAction(
    useCallback(async () => {
      const photoId = pendingPhotoIdRef.current;
      if (!photoId) return;
      await adminRepository.deleteGalleryPhoto(photoId);
      pendingPhotoIdRef.current = null;
      await loadPhotos();
      onUpdated();
    }, [loadPhotos, onUpdated]),
    { successMessage: "Photo deleted." }
  );

  const handleFilesSelected = (file: File | null) => {
    if (!file || !album) return;
    pendingFilesRef.current = [file];
    void uploadPhotos();
  };

  const actionError = loadError ?? uploadError ?? deleteError;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={album ? `Manage Album: ${album.title}` : "Manage Album"}
      icon={<FaImage className="text-[#3476ef]" />}
      size="lg"
      footer={
        <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">
          Close
        </button>
      }
    >
      {actionError ? <FormAlert message={actionError} className="mb-3" /> : null}

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {photos.length} photo{photos.length === 1 ? "" : "s"} in this album
        </p>
        <FileUploadZone
          onFileSelect={handleFilesSelected}
          label={uploading ? "Uploading…" : undefined}
        />
      </div>

      {photos.length === 0 ? (
        <div className="rounded border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          No photos yet. Use the upload area above to add images residents can view in the portal.
        </div>
      ) : (
        <div className="grid max-h-[420px] gap-3 overflow-y-auto sm:grid-cols-2 md:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded border bg-white shadow-sm">
              <img src={photo.url} alt="" className="aspect-square w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    pendingPhotoIdRef.current = photo.id;
                    void deletePhoto();
                  }}
                  className="rounded bg-red-600 p-2 text-white"
                  aria-label="Delete photo"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploading ? (
        <p className="mt-3 text-xs text-slate-500">Uploading photo…</p>
      ) : null}
    </Modal>
  );
}
