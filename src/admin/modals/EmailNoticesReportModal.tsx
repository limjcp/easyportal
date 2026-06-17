import { Modal } from "../../shared/Modal";
import { FaEnvelope } from "react-icons/fa";
import type { AdminNewsItem, EmailNoticeStats } from "../../resident/data/types";

export type EmailNoticeReportItem = {
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

const MOCK_RECIPIENTS = [
  { unit: "Unit 05", name: "Amantina Polanco", email: "amantina@example.com", status: "Delivered", opened: "Yes" },
  { unit: "Unit 04", name: "Suzan Aussaili", email: "suzan@example.com", status: "Delivered", opened: "No" },
  { unit: "Unit 02", name: "John Resident", email: "john@example.com", status: "Bounced", opened: "—" },
  { unit: "Unit 11", name: "Board Member", email: "board@example.com", status: "Delivered", opened: "Yes" },
];

export function EmailNoticesReportModal({ open, item, onClose }: EmailNoticesReportModalProps) {
  if (!open || !item) return null;

  const stats = item.emailStats ?? {
    sent: item.emailTotal,
    delivered: item.emailDelivered,
    opened: Math.floor(item.emailDelivered * 0.65),
    clicked: 2,
    bounced: Math.max(0, item.emailTotal - item.emailDelivered),
    spamReports: 0,
    rejections: 0,
    delayed: 0,
  };

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
        <StatPill label={`${stats.opened} Opened`} tone="primary" />
        <StatPill label={`${stats.clicked} Clicked Link`} tone="primary" />
        {stats.bounced > 0 && <StatPill label={`${stats.bounced} Bounced`} tone="danger" />}
        {stats.spamReports > 0 && <StatPill label={`${stats.spamReports} Spam Reports`} tone="danger" />}
        {stats.rejections > 0 && <StatPill label={`${stats.rejections} Rejections`} tone="danger" />}
        {stats.delayed > 0 && <StatPill label={`${stats.delayed} Delayed`} tone="warning" />}
      </div>
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
            {MOCK_RECIPIENTS.map((row) => (
              <tr key={row.email} className="border-t border-slate-100">
                <td className="px-3 py-2">{row.unit}</td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">{row.email}</td>
                <td className="px-3 py-2">{row.status}</td>
                <td className="px-3 py-2">{row.opened}</td>
              </tr>
            ))}
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
