import { useEffect, useState } from "react";
import { Modal } from "../../shared/Modal";
import { FaEnvelope } from "react-icons/fa";
import type { AdminNewsItem, EmailNoticeRecipientRow, EmailNoticeStats } from "../../resident/data/types";
import { adminRepository } from "../data/adminRepository";

export type EmailNoticeReportItem = {
  id?: string;
  title: string;
  emailTotal: number;
  emailDelivered: number;
  emailStats?: EmailNoticeStats;
};

type EmailNoticesReportModalProps = {
  open: boolean;
  item: AdminNewsItem | EmailNoticeReportItem | null;
  onClose: () => void;
};

function resolveStats(item: AdminNewsItem | EmailNoticeReportItem): EmailNoticeStats {
  if (item.emailStats) return item.emailStats;
  return {
    sent: item.emailTotal,
    delivered: item.emailDelivered,
    opened: 0,
    clicked: 0,
    bounced: Math.max(0, item.emailTotal - item.emailDelivered),
    spamReports: 0,
    rejections: 0,
    delayed: 0,
  };
}

function resolveNewsItemId(item: AdminNewsItem | EmailNoticeReportItem): string | undefined {
  return "id" in item && item.id ? item.id : undefined;
}

export function EmailNoticesReportModal({ open, item, onClose }: EmailNoticesReportModalProps) {
  const [recipients, setRecipients] = useState<EmailNoticeRecipientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !item) {
      setRecipients([]);
      setLoadError(null);
      return;
    }

    const newsItemId = resolveNewsItemId(item);
    if (!newsItemId) {
      setRecipients([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    adminRepository
      .getNewsNoticeEmailRecipients(newsItemId)
      .then((rows) => {
        if (!cancelled) setRecipients(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setRecipients([]);
          setLoadError(err instanceof Error ? err.message : "Failed to load email records.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, item]);

  if (!open || !item) return null;

  const stats = resolveStats(item);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Email Notices: ${item.title}`}
      icon={<FaEnvelope className="text-[#3476ef]" />}
      size="xl"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-slate-300 px-4 py-1.5 text-sm"
        >
          Close
        </button>
      }
    >
      <p className="mb-3 text-xs text-slate-500">
        Delivery data is collected several minutes after posting. Shown for notices submitted on/after
        05-02-2023.
      </p>
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        <StatPill label={`${stats.sent} Sent`} tone="inverse" />
        <StatPill label={`${stats.delivered} Delivered`} tone="success" />
        {stats.opened > 0 ? <StatPill label={`${stats.opened} Opened`} tone="primary" /> : null}
        {stats.clicked > 0 ? <StatPill label={`${stats.clicked} Clicked Link`} tone="primary" /> : null}
        {stats.bounced > 0 ? <StatPill label={`${stats.bounced} Bounced`} tone="danger" /> : null}
        {stats.spamReports > 0 ? (
          <StatPill label={`${stats.spamReports} Spam Reports`} tone="danger" />
        ) : null}
        {stats.rejections > 0 ? (
          <StatPill label={`${stats.rejections} Rejections`} tone="danger" />
        ) : null}
        {stats.delayed > 0 ? <StatPill label={`${stats.delayed} Delayed`} tone="warning" /> : null}
      </div>

      {loadError ? (
        <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left">Unit</th>
              <th className="px-3 py-2 text-left">Recipient</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Opened</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  Loading email delivery records…
                </td>
              </tr>
            ) : recipients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  No delivery records found for this notice.
                </td>
              </tr>
            ) : (
              recipients.map((row) => (
                <tr key={`${row.email}-${row.name}`} className="border-t border-slate-100">
                  <td className="px-3 py-2">{row.unit}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.email}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{row.opened}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

function StatPill({
  label,
  tone,
}: {
  label: string;
  tone: "inverse" | "success" | "primary" | "danger" | "warning";
}) {
  const tones = {
    inverse: "bg-slate-700 text-white",
    success: "bg-[#5cb85c] text-white",
    primary: "bg-[#3476ef] text-white",
    danger: "bg-red-600 text-white",
    warning: "bg-amber-500 text-white",
  };
  return (
    <span className={`cursor-default rounded px-2 py-1 text-xs font-medium ${tones[tone]}`}>
      {label}
    </span>
  );
}
