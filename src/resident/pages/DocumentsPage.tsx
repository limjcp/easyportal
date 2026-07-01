import { useEffect, useMemo, useRef, useState } from "react";
import { CrudPanel } from "../../shared/CrudPanel";
import { FaDownload, FaSearch } from "react-icons/fa";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { useResidentDocumentFolders, useResidentDocuments } from "../../shared/queries/residentListQueries";
import { isQueryPageLoading } from "../../shared/useQueryPageBusy";
import { useSyncFromRefreshKey } from "../../shared/useSyncFromRefreshKey";
import { DataTable } from "../../shared/DataTable";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { residentRepo } from "../data/residentRepository";
import type { DocumentFile } from "../data/types";

export function DocumentsPage({ refreshKey = 0 }: { refreshKey?: number }) {
  const foldersQuery = useResidentDocumentFolders();
  const { data: folders = [], refetch: refetchFolders } = foldersQuery;
  const [folderId, setFolderId] = useState("");
  const documentsQuery = useResidentDocuments(folderId);
  const { data: documents = [], refetch: refetchDocuments } = documentsQuery;
  const pageLoading =
    isQueryPageLoading(foldersQuery) ||
    (Boolean(folderId) && isQueryPageLoading(documentsQuery));
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(0);
  const downloadDocRef = useRef<DocumentFile | null>(null);

  const { run: downloadDocument, error: downloadError } = useAsyncAction(
    async () => {
      const doc = downloadDocRef.current;
      if (!doc) return;
      const url = await residentRepo.getDocumentDownloadUrl(doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
    },
    {
      errorMessage: "Unable to download document.",
      showSuccessToast: false,
    }
  );

  const handleDownload = (doc: DocumentFile) => {
    downloadDocRef.current = doc;
    void downloadDocument();
  };

  useSyncFromRefreshKey(refreshKey, () => {
    void refetchFolders();
    if (folderId) void refetchDocuments();
  });

  useEffect(() => {
    if (folders.length > 0) {
      setFolderId((current) => (folders.some((f) => f.id === current) ? current : folders[0].id));
    }
  }, [folders]);

  useEffect(() => {
    setPage(0);
  }, [folderId, documents]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return documents.filter(
      (d) =>
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.filename.toLowerCase().includes(q)
    );
  }, [documents, search]);

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <CrudPanel loading={pageLoading}>
    <div className="rounded-sm bg-white/95 p-4 shadow-lg sm:p-6">
      <ModuleMessageBanner moduleId="documents" />
      {downloadError ? <FormAlert message={downloadError} className="mb-4" /> : null}
      <h2 className="mb-4 text-lg font-semibold text-slate-700">Documents:/</h2>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Select Folder
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1"
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Show
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="rounded border border-slate-300 px-2 py-1"
          >
            {[5, 10, 25].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          entries
        </label>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="rounded border border-slate-300 py-1.5 pl-9 pr-3 text-sm"
          />
        </div>
      </div>
      <DataTable
        columns={[
          { key: "file", header: "File", render: (r) => r.fileType.toUpperCase() },
          { key: "title", header: "Title", render: (r) => r.title },
          { key: "date", header: "Date", render: (r) => r.date },
          { key: "filename", header: "Filename", render: (r) => r.filename },
          { key: "size", header: "Size", render: (r) => r.size },
          {
            key: "download",
            header: "",
            render: (r) => (
              <button
                type="button"
                onClick={() => void handleDownload(r)}
                className="inline-flex items-center gap-1 text-sm text-[#3476ef] hover:underline"
              >
                <FaDownload className="text-xs" />
                Download
              </button>
            ),
          },
        ]}
        data={paged}
        emptyMessage="There are no files in this folder. If your property has created multiple folders, you can select a different folder from the Select Folder menu above."
      />
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
    </CrudPanel>
  );
}
