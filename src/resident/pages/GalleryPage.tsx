import { useCallback } from "react";
import { CrudPanel } from "../../shared/CrudPanel";
import { useLocalList } from "../../shared/useLocalList";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { residentRepo } from "../data/residentRepository";
import type { ResidentRoute } from "../navigation";

type GalleryPageProps = {
  onNavigate: (route: ResidentRoute) => void;
};

export function GalleryPage({ onNavigate }: GalleryPageProps) {
  const { data: albums, loading } = useLocalList(useCallback(() => residentRepo.getAlbums(), []));

  if (!loading && albums.length === 0) {
    return (
      <CrudPanel>
        <div className="flex min-h-[200px] items-center justify-center rounded-sm bg-white/90 px-6 py-12 text-slate-500 shadow-lg">
          No photo albums available.
        </div>
      </CrudPanel>
    );
  }

  return (
    <CrudPanel loading={loading}>
      <div>
      <ModuleMessageBanner moduleId="galleries" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((album) => (
          <button
            key={album.id}
            type="button"
            onClick={() => onNavigate({ page: "gallery-detail", id: album.id })}
            className="overflow-hidden rounded-sm bg-white text-left shadow-md transition hover:shadow-lg"
          >
            {album.coverUrl ? (
              <img src={album.coverUrl} alt="" className="h-32 w-full object-cover" />
            ) : (
              <div className="flex h-32 items-center justify-center bg-slate-200 text-slate-400">Album</div>
            )}
            <div className="p-4">
              <h3 className="font-medium text-slate-800">{album.title}</h3>
              <p className="text-sm text-slate-500">
                {album.photoCount} photo{album.photoCount === 1 ? "" : "s"}
              </p>
            </div>
          </button>
        ))}
      </div>
      </div>
    </CrudPanel>
  );
}
