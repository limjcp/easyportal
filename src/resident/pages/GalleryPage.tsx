import { useEffect, useState } from "react";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { residentRepo } from "../data/mockRepository";
import type { GalleryAlbum } from "../data/types";

export function GalleryPage() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);

  useEffect(() => {
    residentRepo.getAlbums().then(setAlbums);
  }, []);

  if (albums.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-sm bg-white/90 px-6 py-12 text-slate-500 shadow-lg">
        No photo albums available.
      </div>
    );
  }

  return (
    <div>
      <ModuleMessageBanner moduleId="galleries" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {albums.map((album) => (
        <div key={album.id} className="overflow-hidden rounded-sm bg-white shadow-md">
          <div className="flex h-32 items-center justify-center bg-slate-200 text-slate-400">Album</div>
          <div className="p-4">
            <h3 className="font-medium text-slate-800">{album.title}</h3>
            <p className="text-sm text-slate-500">{album.photoCount} photos</p>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
