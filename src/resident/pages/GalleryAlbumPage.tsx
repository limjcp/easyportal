import { useEffect, useState } from "react";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { Modal } from "../../shared/Modal";
import { residentRepo } from "../data/residentRepository";
import type { GalleryAlbum, GalleryPhoto } from "../data/types";

type GalleryAlbumPageProps = {
  albumId: string;
};

export function GalleryAlbumPage({ albumId }: GalleryAlbumPageProps) {
  const [album, setAlbum] = useState<GalleryAlbum | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([residentRepo.getAlbums(), residentRepo.getAlbumPhotos(albumId)]).then(
      ([albums, albumPhotos]) => {
        if (cancelled) return;
        setAlbum(albums.find((item) => item.id === albumId) ?? null);
        setPhotos(albumPhotos);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [albumId]);

  return (
    <div>
      <ModuleMessageBanner moduleId="galleries" />
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-800">{album?.title ?? "Photo Album"}</h2>
        <p className="text-sm text-slate-500">
          {photos.length} photo{photos.length === 1 ? "" : "s"}
        </p>
      </div>

      {photos.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-sm bg-white/90 px-6 py-12 text-slate-500 shadow-lg">
          No photos in this album yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelectedPhoto(photo)}
              className="overflow-hidden rounded-sm bg-white shadow-md transition hover:shadow-lg"
            >
              <img src={photo.url} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Modal
        open={selectedPhoto !== null}
        onClose={() => setSelectedPhoto(null)}
        title={album?.title ?? "Photo"}
        size="lg"
      >
        {selectedPhoto ? (
          <img src={selectedPhoto.url} alt="" className="max-h-[70vh] w-full object-contain" />
        ) : null}
      </Modal>
    </div>
  );
}
