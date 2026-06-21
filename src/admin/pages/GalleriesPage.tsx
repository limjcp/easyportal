import { useCallback, useEffect, useRef, useState } from "react";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { OptionsDropdown } from "../components/AdminBadges";
import { AdminPanelTable } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AddAlbumModal } from "../modals/AddAlbumModal";
import { ManageAlbumModal } from "../modals/ManageAlbumModal";
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
  const [manageAlbum, setManageAlbum] = useState<GalleryAlbum | null>(null);
  const pendingAlbumRef = useRef<{ id: string; title?: string } | null>(null);
  const pendingCreateTitleRef = useRef("");

  useEffect(() => {
    adminRepository.getGalleryAlbums().then(setItems);
  }, [refreshKey]);

  const { run: createAlbumRun } = useAsyncAction(
    useCallback(async () => {
      const title = pendingCreateTitleRef.current;
      if (!title) return;
      const album = await adminRepository.createAlbum(title);
      onRefresh();
      setManageAlbum(album);
    }, [onRefresh]),
    { successMessage: "Album created." }
  );

  const createAlbum = async (title: string) => {
    pendingCreateTitleRef.current = title;
    await createAlbumRun();
  };

  const { run: updateAlbumRun, error: updateError } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingAlbumRef.current;
      if (!pending?.title) return;
      await adminRepository.updateAlbum(pending.id, { title: pending.title });
      onRefresh();
    }, [onRefresh]),
    { successMessage: "Album updated.", showErrorToast: false }
  );

  const { run: deleteAlbumRun, error: deleteError } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingAlbumRef.current;
      if (!pending) return;
      await adminRepository.deleteAlbum(pending.id);
      onRefresh();
    }, [onRefresh]),
    { successMessage: "Album deleted." }
  );

  const actionError = updateError ?? deleteError;

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
      {actionError ? <FormAlert message={actionError} className="mb-3" /> : null}
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
                    label: "Manage",
                    onClick: () => setManageAlbum(row),
                  },
                  {
                    label: "Edit",
                    onClick: () => {
                      const title = prompt("Edit album title:", row.title);
                      if (title) {
                        pendingAlbumRef.current = { id: row.id, title };
                        void updateAlbumRun();
                      }
                    },
                  },
                  {
                    label: "Delete",
                    onClick: () => {
                      pendingAlbumRef.current = { id: row.id };
                      void deleteAlbumRun();
                    },
                  },
                ]}
              />
            ),
          },
        ]}
      />
      <AddAlbumModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={createAlbum}
      />
      <ManageAlbumModal
        open={manageAlbum !== null}
        album={manageAlbum}
        onClose={() => setManageAlbum(null)}
        onUpdated={onRefresh}
      />
    </>
  );
}
