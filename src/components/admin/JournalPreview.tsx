import { BookOpenCheck, CheckCircle2 } from "lucide-react";
import { CATEGORIES, LEDGER } from "@/lib/mock";
import { baht } from "@/lib/meta";
import type { Expense } from "@/lib/types";

type Entry = { code: string; name: string; dr: number; cr: number };

/**
 * รายการบันทึกบัญชีเมื่ออนุมัติ (พรีวิว)
 * - เบิกค่าใช้จ่าย: Dr ค่าใช้จ่ายตามหมวด / Cr ค่าใช้จ่ายค้างจ่าย–พนักงาน
 * - เงินยืม:       Dr เงินทดรองจ่ายพนักงาน / Cr ค่าใช้จ่ายค้างจ่าย–พนักงาน
 * ใบกำกับภาษีอย่างย่อ/ใบเสร็จ → VAT รวมในค่าใช้จ่าย (ขอคืนภาษีซื้อไม่ได้)
 */
export function journalFor(e: Expense): Entry[] {
  if (e.type === "advance") {
    return [
      { ...LEDGER.advance, dr: e.total, cr: 0 },
      { ...LEDGER.accruedEmployee, dr: 0, cr: e.total },
    ];
  }
  const byAccount = new Map<string, Entry>();
  for (const it of e.items) {
    const c = CATEGORIES.find((x) => x.name === it.category) ?? CATEGORIES[CATEGORIES.length - 1];
    const row = byAccount.get(c.accountCode) ?? { code: c.accountCode, name: c.accountName, dr: 0, cr: 0 };
    row.dr += it.amount;
    byAccount.set(c.accountCode, row);
  }
  return [...byAccount.values(), { ...LEDGER.accruedEmployee, dr: 0, cr: e.total }];
}

export function JournalPreview({ e }: { e: Expense }) {
  const rows = journalFor(e);
  const dr = rows.reduce((a, r) => a + r.dr, 0);
  const cr = rows.reduce((a, r) => a + r.cr, 0);
  const balanced = Math.abs(dr - cr) < 0.005;
  return (
    <section className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <h4 className="flex items-center gap-2 text-sm font-bold"><BookOpenCheck size={16} className="text-blue-600" /> บันทึกบัญชีเมื่ออนุมัติ</h4>
        <span className={`inline-flex items-center gap-1 text-xs font-bold ${balanced ? "text-emerald-600" : "text-rose-600"}`}>
          <CheckCircle2 size={13} /> {balanced ? "เดบิต = เครดิต" : "ไม่สมดุล"}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-500">
          <tr><th className="px-4 py-2 text-left font-bold">บัญชี</th><th className="px-2 py-2 text-right font-bold">เดบิต</th><th className="px-4 py-2 text-right font-bold">เครดิต</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.code}>
              <td className={`px-4 py-2 ${r.cr ? "pl-8" : ""}`}><span className="font-mono text-xs text-slate-400">{r.code}</span> <span className="font-semibold">{r.name}</span></td>
              <td className="px-2 py-2 text-right tabular-nums">{r.dr ? baht(r.dr) : ""}</td>
              <td className="px-4 py-2 text-right tabular-nums">{r.cr ? baht(r.cr) : ""}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-slate-200 bg-slate-50 font-bold">
          <tr><td className="px-4 py-2">รวม</td><td className="px-2 py-2 text-right tabular-nums">{baht(dr)}</td><td className="px-4 py-2 text-right tabular-nums">{baht(cr)}</td></tr>
        </tfoot>
      </table>
    </section>
  );
}
