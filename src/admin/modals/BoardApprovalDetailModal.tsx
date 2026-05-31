import { FaCheck, FaTimes } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { StatusBadge, UnreadBadge } from "../components/AdminBadges";
import type { BoardApproval } from "../../resident/data/types";

type BoardApprovalDetailModalProps = {
  item: BoardApproval | null;
  onClose: () => void;
};

export function BoardApprovalDetailModal({ item, onClose }: BoardApprovalDetailModalProps) {
  if (!item) return null;

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={item.title}
      size="xl"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-slate-300 px-4 py-2 text-sm"
        >
          Close
        </button>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />
          {item.unread && <UnreadBadge />}
          <span className="text-slate-500">Created {item.created}</span>
          {item.closed && <span className="text-slate-500">· Closed {item.closed}</span>}
        </div>

        <div className="flex flex-wrap gap-6 rounded border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <FaCheck className="text-green-600" title="Approved votes" />
            <span className="font-medium">{item.approvedVotes}</span>
            <span className="text-slate-500">approved</span>
          </div>
          <div className="flex items-center gap-2">
            <FaTimes className="text-red-600" title="Disapproved votes" />
            <span className="font-medium">{item.disapprovedVotes}</span>
            <span className="text-slate-500">disapproved</span>
          </div>
          <div>
            <span className="text-slate-500">Votes: </span>
            <span className="font-medium">{item.votes}</span>
          </div>
        </div>

        <div>
          <h4 className="mb-1 font-semibold text-slate-700">Description</h4>
          <p className="whitespace-pre-wrap text-slate-600">{item.description}</p>
        </div>

        <dl className="grid gap-2 sm:grid-cols-2">
          {item.vendor && (
            <>
              <dt className="font-medium text-slate-600">Vendor</dt>
              <dd>{item.vendor}</dd>
            </>
          )}
          {item.type && (
            <>
              <dt className="font-medium text-slate-600">Type</dt>
              <dd>{item.type}</dd>
            </>
          )}
          {item.amount && (
            <>
              <dt className="font-medium text-slate-600">Amount</dt>
              <dd>{item.amount}</dd>
            </>
          )}
          {item.items && (
            <>
              <dt className="font-medium text-slate-600">Items</dt>
              <dd>{item.items}</dd>
            </>
          )}
        </dl>
      </div>
    </Modal>
  );
}
