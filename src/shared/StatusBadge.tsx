import { cn } from "../utils/cn";
import type { EmailStatus } from "../resident/data/types";

export function StatusBadge({ status }: { status: EmailStatus }) {
  const styles: Record<EmailStatus, string> = {
    delivered: "bg-green-100 text-green-800",
    bounced: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
  };
  const labels: Record<EmailStatus, string> = {
    delivered: "Delivered",
    bounced: "Bounced",
    pending: "Pending",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}
