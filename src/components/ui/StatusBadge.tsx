import { STATUS_META } from "@/lib/meta";
import type { ExpenseStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: ExpenseStatus }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-bold shadow-sm ${m.cls}`}>
      <Icon size={12} aria-hidden /> {m.label}
    </span>
  );
}
