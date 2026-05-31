import { useEffect, useState } from "react";
import { OptionsDropdown } from "../components/AdminBadges";
import { AdminPanelTable } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AddAlbumModal } from "../modals/AddAlbumModal";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type { GalleryAlbum } from "../../resident/data/types";

type GalleriesPageProps = {
  route: AdminRoute & { page: "galleries" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

export function GalleriesPage({ route, onNavigate, refreshKey, onRefresh }: GalleriesPageProps) {
  const [items, setItems] = useState<GalleryAlbum[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    adminRepository.getGalleryAlbums().then(setItems);
  }, [refreshKey]);

  return (
    <>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <button type="button" onClick={() => setAddOpen(true)} className="rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white">
            + Add Album
          </button>
        }
      />
      <AdminPanelTable
        title="Galleries"
        data={items}
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        page={page}
        onPageChange={setPage}
        columns={[
          { key: "title", header: "Title", render: (row) => row.title },
          { key: "photos", header: "Photo Count", render: (row) => row.photoCount },
          {
            key: "options",
            header: "Options",
            render: (row) => (
              <OptionsDropdown
                options={[
                  {
                    label: "Edit",
                    onClick: () => {
                      const title = prompt("Edit album title:", row.title);
                      if (title) adminRepository.updateAlbum(row.id, { title }).then(onRefresh);
                    },
                  },
                  { label: "Delete", onClick: () => adminRepository.deleteAlbum(row.id).then(onRefresh) },
                ]}
              />
            ),
          },
        ]}
      />
      <AddAlbumModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (title) => {
          await adminRepository.createAlbum(title);
          onRefresh();
        }}
      />
    </>
  );
}
