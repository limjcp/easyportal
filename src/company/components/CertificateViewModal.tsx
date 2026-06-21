import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  FaArchive,
  FaBell,
  FaCertificate,
  FaFileArchive,
  FaFileImage,
  FaFilePdf,
  FaPrint,
  FaTimes,
  FaTrash,
  FaUndo,
} from "react-icons/fa";
import type { CertificateDetail, CertificateFile } from "../../resident/data/types";
import { cn } from "../../utils/cn";
import { ConfirmModal } from "../../shared/ConfirmModal";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { companyRepository } from "../data/companyRepository";

type CertificateViewModalProps = {
  open: boolean;
  detail: CertificateDetail | null;
  loading?: boolean;
  onClose: () => void;
  onRefresh?: () => void;
};

type ConfirmKind = "archive" | "deleteFile" | "refund" | "resend" | null;

function SummaryCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs font-semibold text-slate-700">
        {title}
      </div>
      <div className="px-2 py-2.5 text-center text-sm text-slate-800">{children}</div>
    </div>
  );
}

function SectionPanel({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        {action}
      </div>
      <div className="p-3 text-sm text-slate-700">{children}</div>
    </div>
  );
}

function FileIcon({ kind }: { kind: CertificateFile["kind"] }) {
  if (kind === "zip") return <FaFileArchive className="mx-auto text-5xl text-amber-500" />;
  if (kind === "image") return <FaFileImage className="mx-auto text-5xl text-orange-500" />;
  return <FaFilePdf className="mx-auto text-5xl text-red-600" />;
}

export function CertificateViewModal({
  open,
  detail,
  loading = false,
  onClose,
  onRefresh,
}: CertificateViewModalProps) {
  const [showExcluded, setShowExcluded] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [pendingFileLabel, setPendingFileLabel] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);
  const pendingFileIdRef = useRef<string | null>(null);
  const uploadExcludedRef = useRef(false);

  const refresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const { run: runUpload, loading: uploading } = useAsyncAction(
    useCallback(async () => {
      const file = pendingFileRef.current;
      if (!detail || !file) return;
      await companyRepository.uploadCertificateFile(
        detail.id,
        file,
        pendingFileLabel ?? undefined,
        uploadExcludedRef.current
      );
      setPendingFileLabel(null);
      refresh();
    }, [detail, pendingFileLabel, refresh]),
    { successMessage: "File uploaded." }
  );

  const { run: runOpenFile, loading: openingFile } = useAsyncAction(
    useCallback(async () => {
      const fileId = pendingFileIdRef.current;
      if (!fileId) return;
      const url = await companyRepository.getCertificateFileUrl(fileId);
      window.open(url, "_blank", "noopener,noreferrer");
    }, []),
    { showSuccessToast: false }
  );

  const { run: runDeleteFile, loading: deletingFile } = useAsyncAction(
    useCallback(async () => {
      const fileId = pendingFileIdRef.current;
      if (!fileId) return;
      await companyRepository.deleteCertificateFile(fileId);
      setConfirmKind(null);
      refresh();
    }, [refresh]),
    { successMessage: "File deleted." }
  );

  const { run: runMarkUnread, loading: markingUnread } = useAsyncAction(
    useCallback(async () => {
      if (!detail) return;
      await companyRepository.markStatusCertificateUnread(detail.id);
      refresh();
    }, [detail, refresh]),
    { successMessage: "Marked as unread." }
  );

  const { run: runArchive, loading: archiving } = useAsyncAction(
    useCallback(async () => {
      if (!detail) return;
      await companyRepository.archiveStatusCertificate(detail.id);
      setConfirmKind(null);
      onClose();
      onRefresh?.();
    }, [detail, onClose, onRefresh]),
    { successMessage: "Certificate archived." }
  );

  const { run: runRefund, loading: refunding } = useAsyncAction(
    useCallback(async () => {
      if (!detail) return;
      await companyRepository.refundAndArchiveCertificate(detail.id);
      setConfirmKind(null);
      onClose();
      onRefresh?.();
    }, [detail, onClose, onRefresh]),
    { successMessage: "Certificate refunded and archived." }
  );

  const { run: runResend, loading: resending } = useAsyncAction(
    useCallback(async () => {
      if (!detail) return;
      await companyRepository.resendCertificateToUser(detail.id);
      setConfirmKind(null);
      refresh();
    }, [detail, refresh]),
    { successMessage: "Certificate resent to user." }
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setShowExcluded(false);
      setConfirmKind(null);
      setPendingFileLabel(null);
    }
  }, [open]);

  if (!open) return null;

  if (!detail) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
        <div className="rounded-sm bg-white px-8 py-6 text-center text-sm text-slate-600 shadow-2xl">
          <p>{loading ? "Loading certificate…" : "Certificate not found."}</p>
          {!loading ? (
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const actionLoading =
    uploading || openingFile || deletingFile || markingUnread || archiving || refunding || resending;

  const sentLabel =
    detail.sentBy && detail.sentAt ? `Sent by ${detail.sentBy} on ${detail.sentAt}` : null;

  const FileTile = ({ file, onDelete }: { file: CertificateFile; onDelete: () => void }) => (
    <div className="text-center">
      <button
        type="button"
        className="block w-full hover:opacity-90 disabled:opacity-50"
        disabled={actionLoading}
        onClick={() => {
          pendingFileIdRef.current = file.id;
          void runOpenFile();
        }}
      >
        <FileIcon kind={file.kind} />
        <span className="mt-1 block text-sm font-medium text-slate-900">{file.label}</span>
        <p className="mt-1 text-xs text-slate-700">
          {file.fileName} ({file.size})
          <br />
          {file.uploadedDate}
        </p>
      </button>
      <button
        type="button"
        disabled={actionLoading}
        onClick={onDelete}
        className="mt-2 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        <FaTrash className="mr-1 inline" />
        Delete
      </button>
    </div>
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            pendingFileRef.current = file;
            uploadExcludedRef.current = false;
            void runUpload();
          }
          e.target.value = "";
        }}
      />

      <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-2 sm:p-4 sm:pt-6">
        <div
          className="mb-6 flex w-full max-w-5xl flex-col rounded-sm bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="certificate-view-title"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
            <div className="min-w-0 flex-1">
              <h2
                id="certificate-view-title"
                className="flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-800"
              >
                <FaCertificate className="text-slate-500" />
                Request #{detail.requestNumber}
              </h2>
              {sentLabel && (
                <span className="mt-2 inline-block rounded bg-[#5cb85c] px-2 py-1 text-xs font-medium text-white">
                  {sentLabel}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>

          <div className="max-h-[min(75vh,900px)] overflow-y-auto px-4 py-4 sm:px-5">
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryCard title="Unit:">{detail.unit}</SummaryCard>
              <SummaryCard title="Date Created:">{detail.dateCreated}</SummaryCard>
              <SummaryCard title="Delivery Type:">{detail.deliveryType}</SummaryCard>
              <SummaryCard title="Date Due:">{detail.dateDue}</SummaryCard>
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <SectionPanel title="Building:">
                {detail.buildingName}
                <br />
                {detail.buildingAddress}
                <br />
                {detail.buildingCityLine}
              </SectionPanel>
              <SectionPanel title="Requested By:">
                {detail.requestedByName}
                <br />
                {detail.requestedByPhone || "—"}
                <br />
                {detail.requestedByEmail ? (
                  <a href={`mailto:${detail.requestedByEmail}`} className="text-[#337ab7] hover:underline">
                    {detail.requestedByEmail}
                  </a>
                ) : (
                  "—"
                )}
              </SectionPanel>
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <SectionPanel title="Parking, & Locker Information:">
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1 pr-4 text-slate-600">Parking:</td>
                      <td>{detail.parkingSlots[0]}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 text-slate-600">Parking:</td>
                      <td>{detail.parkingSlots[1]}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 text-slate-600">Locker:</td>
                      <td>{detail.lockerSlots[0]}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 text-slate-600">Locker:</td>
                      <td>{detail.lockerSlots[1]}</td>
                    </tr>
                  </tbody>
                </table>
                {detail.sellerRetainsSeparatelyDeeded && (
                  <p className="mt-3 text-sm text-red-600">
                    <span className="font-semibold">*</span> Seller will retain (separately deeded)
                  </p>
                )}
              </SectionPanel>

              <div className="space-y-4">
                <SectionPanel title="Purchase Information:">
                  <div className="space-y-2">
                    <Row label="Owners Name:" value={detail.ownersName} />
                    <Row label="Purchasers Name:" value={detail.purchasersName || "—"} />
                    <Row label="Closing Date:" value={detail.closingDate || "—"} />
                    <Row label="Reason for Request:" value={detail.reasonForRequest} />
                  </div>
                </SectionPanel>
                <SectionPanel title="Barristers & Solicitors:">
                  <div className="space-y-2">
                    <Row label="Name:" value={detail.solicitorName || " "} />
                    <Row label="Phone:" value={detail.solicitorPhone || " "} />
                    <Row label="Fax:" value={detail.solicitorFax || " "} />
                  </div>
                </SectionPanel>
              </div>
            </div>

            <SectionPanel
              title="File Uploads:"
              action={
                <button
                  type="button"
                  disabled={actionLoading}
                  className="rounded bg-[#337ab7] px-2 py-1 text-xs text-white hover:bg-[#286090] disabled:opacity-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  + Add
                </button>
              }
            >
              {detail.files.length === 0 ? (
                <p className="text-center text-sm text-slate-500">No files uploaded.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {detail.files.map((file) => (
                    <FileTile
                      key={file.id}
                      file={file}
                      onDelete={() => {
                        pendingFileIdRef.current = file.id;
                        setConfirmKind("deleteFile");
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="mt-6 border-t border-slate-200 pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowExcluded((v) => !v)}
                  className="rounded bg-slate-800 px-3 py-1 text-xs text-white hover:bg-slate-700"
                >
                  {showExcluded ? "Hide Excluded Files" : "Show Excluded Files"}
                </button>
              </div>
              {showExcluded && (
                <div className="mt-4 text-center text-sm text-slate-500">
                  {detail.excludedFiles.length === 0 ? (
                    <em>No excluded files.</em>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {detail.excludedFiles.map((file) => (
                        <FileTile
                          key={file.id}
                          file={file}
                          onDelete={() => {
                            pendingFileIdRef.current = file.id;
                            setConfirmKind("deleteFile");
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </SectionPanel>

            <div className="mt-4">
              <SectionPanel title="History:">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] border border-slate-200 text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-2 py-2 text-center font-semibold text-slate-600">Date</th>
                        <th className="px-2 py-2 text-center font-semibold text-slate-600">User</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.history.map((entry, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="px-2 py-1.5 text-center text-xs">{entry.date}</td>
                          <td className="px-2 py-1.5 text-center text-xs">{entry.user}</td>
                          <td className="px-2 py-1.5 text-left text-xs">{entry.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionPanel>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 bg-white px-4 py-3">
            {!detail.archived && (
              <button
                type="button"
                disabled={actionLoading}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                onClick={() => setConfirmKind("archive")}
              >
                <FaArchive className="mr-1 inline" />
                Archive
              </button>
            )}
            <button
              type="button"
              className="rounded bg-[#337ab7] px-3 py-1.5 text-sm text-white hover:bg-[#286090]"
              onClick={() => window.print()}
            >
              <FaPrint className="mr-1 inline" />
              Print
            </button>
            {!detail.unread && (
              <button
                type="button"
                disabled={actionLoading}
                className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
                onClick={() => void runMarkUnread()}
              >
                Set as Unread
              </button>
            )}
            {!detail.archived && (
              <>
                <button
                  type="button"
                  disabled={actionLoading}
                  className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                  onClick={() => setConfirmKind("refund")}
                >
                  <FaUndo className="mr-1 inline" />
                  Refund &amp; Archive
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  className="rounded bg-[#7b4bb7] px-3 py-1.5 text-sm text-white hover:bg-[#6a419f] disabled:opacity-50"
                  onClick={() => setConfirmKind("resend")}
                >
                  <FaBell className="mr-1 inline" />
                  Resend to User
                </button>
              </>
            )}
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmKind === "archive"}
        onClose={() => setConfirmKind(null)}
        title="Archive Certificate"
        message="Archive this certificate request?"
        confirmLabel="Archive"
        onConfirm={() => void runArchive()}
        loading={archiving}
      />
      <ConfirmModal
        open={confirmKind === "deleteFile"}
        onClose={() => setConfirmKind(null)}
        title="Delete File"
        message="Delete this file permanently?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void runDeleteFile()}
        loading={deletingFile}
      />
      <ConfirmModal
        open={confirmKind === "refund"}
        onClose={() => setConfirmKind(null)}
        title="Refund & Archive"
        message="Refund and archive this certificate request?"
        confirmLabel="Refund & Archive"
        variant="danger"
        onConfirm={() => void runRefund()}
        loading={refunding}
      />
      <ConfirmModal
        open={confirmKind === "resend"}
        onClose={() => setConfirmKind(null)}
        title="Resend to User"
        message="Resend this certificate to the user?"
        confirmLabel="Resend"
        onConfirm={() => void runResend()}
        loading={resending}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-12 gap-2">
      <div className={cn("col-span-5 text-slate-600")}>{label}</div>
      <div className="col-span-7">{value}</div>
    </div>
  );
}
