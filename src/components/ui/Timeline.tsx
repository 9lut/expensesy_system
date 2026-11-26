import { Check } from "lucide-react";
import { MAIN_STEPS, STATUS_META, thDate } from "@/lib/meta";
import type { Expense } from "@/lib/types";

/** ไทม์ไลน์แนวตั้ง (ประวัติทั้งหมด) */
export function Timeline({ history }: { history: Expense["history"] }) {
  return (
    <ol className="relative ml-3 border-l-2 border-slate-200">
      {[...history].reverse().map((h, i) => {
        const M = STATUS_META[h.status];
        return (
          <li key={i} className="mb-5 ml-5 last:mb-0">
            <span className={`absolute -left-[13px] grid size-6 place-items-center rounded-full ring-4 ring-white ${M.cls}`}><M.icon size={13} /></span>
            <p className="font-bold">{M.label}</p>
            <p className="text-sm text-slate-500">{h.by} · {thDate(h.at)}</p>
            {h.note && <p className="mt-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-700">{h.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}

/** Stepper แนวนอน (คอม) — แสดงว่าอยู่ขั้นไหนของ Workflow หลัก */
export function Stepper({ e }: { e: Expense }) {
  const reached = new Set(e.history.map((h) => h.status));
  if (e.status === "paid" || e.status === "cleared" || e.status === "clearing") MAIN_STEPS.forEach((s) => reached.add(s.key));
  if (e.status === "awaiting_payment") reached.add("approved");
  const stopped = e.status === "rejected" || e.status === "cancelled";
  return (
    <ol className="flex items-center">
      {MAIN_STEPS.map((s, i) => {
        const done = reached.has(s.key);
        return (
          <li key={s.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span className={`grid size-8 place-items-center rounded-full text-sm font-bold ${done ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                {done ? <Check size={16} /> : i + 1}
              </span>
              <span className={`whitespace-nowrap text-sm font-bold ${done ? "text-slate-900" : "text-slate-400"}`}>{s.label}</span>
            </div>
            {i < MAIN_STEPS.length - 1 && <span className={`mx-3 h-0.5 flex-1 rounded ${done && !stopped ? "bg-blue-600" : "bg-slate-200"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
