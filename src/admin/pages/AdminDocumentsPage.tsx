import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaDownload,
  FaFileAlt,
  FaUnlock,
} from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { FileUploadZone } from "../../shared/FileUploadZone";
import { OptionsDropdown } from "../components/AdminBadges";
import { AdminPanelTable } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type {
  CreateDocumentInput,
  DocumentFile,
  DocumentFolder,
  DocumentStorageStats,
} from "../../resident/data/types";

const DEFAULT_FOLDER_ID = "0";

type AdminDocumentsPageProps = {
  route: AdminRoute & { page: "documents" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

export function AdminDocumentsPage({
  route,
  onNavigate,
  refreshKey,
  onRefresh,
}: AdminDocumentsPageProps) {
  const folderId = route.folderId ?? DEFAULT_FOLDER_ID;
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [storage, setStorage] = useState<DocumentStorageStats | null>(null);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocumentFile | null>(null);

  useEffect(() => {
    adminRepository.getDocumentFolders().then(setFolders);
    adminRepository.getDocumentStorageStats().then(setStorage);
  }, [refreshKey]);

  useEffect(() => {
    adminRepository.getDocuments(folderId).then(setDocuments);
    setPage(1);
  }, [folderId, refreshKey]);

  const selectedFolder = folders.find((f) => f.id === folderId);

  const folderGroups = useMemo(() => {
    const residentRoot = folders.filter((f) => f.section === "resident-portal");
    const residentChildren = folders.filter(
      (f) => !f.section && f.id !== "0" && f.id !== "1"
    );
    const adminOnly = folders.filter((f) => f.section === "admin-only");
    return { residentRoot, residentChildren, adminOnly };
  }, [folders]);

  const setFolder = (id: string) => {
    onNavigate({ page: "documents", folderId: id });
  };

  const usedPercent = storage
    ? Math.min(100, Math.round((storage.usedMb / storage.totalMb) * 1000) / 10)
    : 0;
  const freePercent = storage ? 100 - usedPercent : 100;
  const freeMb = storage ? storage.totalMb - storage.usedMb : 0;

  return (
    <>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded bg-[#7D5DA7] px-3 py-1.5 text-sm text-white hover:opacity-90"
          >
            + Upload Document
          </button>
        }
      />

      {storage && (
        <div className="mb-4 overflow-hidden rounded-sm border border-slate-300 bg-white">
          <div className="flex h-9 text-sm font-medium text-white">
            <div
              className="flex items-center justify-center bg-slate-700"
              style={{ width: `${usedPercent}%`, minWidth: usedPercent > 0 ? "2.5rem" : 0 }}
              title={`${storage.usedMb} MB used`}
            />
            <div
              className="flex flex-1 items-center justify-center bg-[#79d0df] px-2"
              title={`${freeMb} MB free`}
            >
              {freeMb}mb free of {storage.totalMb}mb ({freePercent.toFixed(1)}%)
            </div>
          </div>
        </div>
      )}

      <div className="min-w-0 max-w-full rounded-sm border border-slate-300 bg-white shadow-sm">
        <div className="flex flex-col gap-2 bg-[#3476ef] px-4 py-2 text-sm font-semibold text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <FaUnlock className="shrink-0" />
            <span className="truncate">
              Files / Resident Portal Documents / {selectedFolder?.name ?? "—"}
            </span>
          </div>
          <span className="shrink-0 text-xs font-normal text-white/90">
            *Residents will see these files under &apos;General Documents&apos;
          </span>
        </div>

        <div className="border-b border-slate-300 bg-[#bebebe] px-3 py-3">
          <label className="flex min-w-0 flex-col gap-1 text-sm sm:flex-row sm:items-center">
            <span className="shrink-0 rounded bg-[#7D5DA7] px-3 py-2 font-medium text-white">
              Folder:
            </span>
            <select
              value={folderId}
              onChange={(e) => setFolder(e.target.value)}
              className="min-w-0 flex-1 rounded border border-slate-400 bg-white px-3 py-2 text-slate-800"
            >
              {folderGroups.residentRoot.map((f) => (
                <option key={f.id} value={f.id} className="bg-slate-200 font-bold">
                  {f.name}
                </option>
              ))}
              {folderGroups.residentChildren.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
              {folderGroups.adminOnly.map((f) => (
                <option key={f.id} value={f.id} className="bg-slate-200 font-bold">
                  {f.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <AdminPanelTable
          title=""
          showHeader={false}
          headerColor="purple"
          data={documents}
          search={search}
          onSearchChange={setSearch}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          page={page}
          onPageChange={setPage}
          emptyMessage="There are no files in this folder"
          columns={[
            {
              key: "date",
              header: "",
              className: "w-10 text-center",
              render: (row) => (
                <span title="Date uploaded" className="inline-flex justify-center text-slate-500">
                  <FaCalendarAlt />
                  <span className="sr-only">{row.date}</span>
                </span>
              ),
            },
            {
              key: "dateText",
              header: "Uploaded",
              hideBelow: "md",
              className: "whitespace-nowrap",
              render: (row) => row.date,
            },
            {
              key: "file",
              header: "",
              className: "w-10 text-center",
              render: (row) => (
                <FaFileAlt className="mx-auto text-slate-500" title={row.fileType} />
              ),
            },
            {
              key: "title",
              header: "Title",
              render: (row) => (
                <button
                  type="button"
                  onClick={() => setViewDoc(row)}
                  className="text-left text-[#3476ef] hover:underline"
                >
                  {row.title}
                </button>
              ),
            },
            {
              key: "shownTo",
              header: "Shown To",
              hideBelow: "lg",
              render: (row) => row.shownTo,
            },
            {
              key: "downloads",
              header: "",
              className: "text-center",
              render: (row) => (
                <span
                  className="inline-flex items-center justify-center gap-1 text-slate-600"
                  title="Resident downloads"
                >
                  <FaDownload className="text-xs" />
                  <span className="text-xs">{row.downloadCount}</span>
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              className: "whitespace-nowrap",
              render: (row) => (
                <OptionsDropdown
                  options={[
                    { label: "View", onClick: () => setViewDoc(row) },
                    {
                      label: "Delete",
                      onClick: () => adminRepository.deleteDocument(row.id).then(onRefresh),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </div>

      <UploadDocumentModal
        open={uploadOpen}
        folderId={folderId}
        folderName={selectedFolder?.name ?? "Folder"}
        onClose={() => setUploadOpen(false)}
        onSubmit={async (input) => {
          await adminRepository.createDocument(input);
          setUploadOpen(false);
          onRefresh();
        }}
      />

      <Modal
        open={!!viewDoc}
        onClose={() => setViewDoc(null)}
        title={viewDoc?.title ?? "Document"}
        footer={
          <button
            type="button"
            onClick={() => setViewDoc(null)}
            className="rounded border border-slate-300 px-4 py-2 text-sm"
          >
            Close
          </button>
        }
      >
        {viewDoc && (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <dt className="font-medium text-slate-600">Filename</dt>
            <dd>{viewDoc.filename}</dd>
            <dt className="font-medium text-slate-600">Size</dt>
            <dd>{viewDoc.size}</dd>
            <dt className="font-medium text-slate-600">Uploaded</dt>
            <dd>{viewDoc.date}</dd>
            <dt className="font-medium text-slate-600">Shown To</dt>
            <dd>{viewDoc.shownTo}</dd>
            <dt className="font-medium text-slate-600">Downloads</dt>
            <dd>{viewDoc.downloadCount}</dd>
          </dl>
        )}
      </Modal>
    </>
  );
}

function UploadDocumentModal({
  open,
  folderId,
  folderName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  folderId: string;
  folderName: string;
  onClose: () => void;
  onSubmit: (input: CreateDocumentInput) => void;
}) {
  const [title, setTitle] = useState("");
  const [shownTo, setShownTo] = useState("All Residents");

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("Title is required.");
      return;
    }
    onSubmit({
      folderId,
      fileType: "pdf",
      title: title.trim(),
      date: new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
      filename: `${title.trim().replace(/\s+/g, "_").toLowerCase()}.pdf`,
      size: "128 KB",
      shownTo,
      downloadCount: 0,
    });
    setTitle("");
    setShownTo("All Residents");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload Document"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded border px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded bg-[#7D5DA7] px-4 py-2 text-sm text-white"
          >
            Upload
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-slate-600">
        Uploading to folder: <strong>{folderName}</strong>
      </p>
      <div className="space-y-3">
        <label className="block text-sm">
          Title *
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="block text-sm">
          Shown To
          <select
            value={shownTo}
            onChange={(e) => setShownTo(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          >
            <option>All Residents</option>
            <option>Board Only</option>
            <option>Admin Only</option>
          </select>
        </label>
        <FileUploadZone />
        <p className="text-xs text-slate-500">Mock upload — adds a placeholder document entry.</p>
      </div>
    </Modal>
  );
}
