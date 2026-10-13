import { STATUS_CONFIG, PRIORITY_CONFIG } from '../lib/constants';
import type { ComplaintStatus, Priority } from '../types';

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  );
}
