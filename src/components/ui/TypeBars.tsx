import { TYPE_META, baht } from "@/lib/meta";
import type { Expense, ExpenseType } from "@/lib/types";

/** แท่งสัดส่วนยอดเบิกตามประเภท */
export function TypeBars({ items }: { items: Expense[] }) {
  const total = items.reduce((a, e) => a + e.total, 0) || 1;
  return (
    <ul className="space-y-4">
      {(Object.keys(TYPE_META) as ExpenseType[]).map((k) => {
        const sum = items.filter((e) => e.type === k).reduce((a, e) => a + e.total, 0);
        const T = TYPE_META[k];
        return (
          <li key={k}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-semibold text-slate-700"><T.icon size={16} className="text-slate-400" />{T.label}</span>
              <span className="font-bold tabular-nums">{baht(sum)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${(sum / total) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
