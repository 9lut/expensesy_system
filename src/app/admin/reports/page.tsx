"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, FileSpreadsheet, Landmark, Printer, Receipt, Scale, Users, Wallet, type LucideIcon } from "lucide-react";
import { EXPENSES, LEDGER, VAT_INVOICES, daysFromToday, isOpenAdvance } from "@/lib/mock";
import { baht, thDate } from "@/lib/meta";
import { taxIdValid } from "@/lib/ocr";
import { byAccount, topEmployees } from "@/lib/dashboard";
import type { Expense } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { journalFor } from "@/components/admin/JournalPreview";

type Tab = "accounts" | "journal" | "vat" | "advances" | "people";
const TABS: { key: Tab; label: string; icon: LucideIcon; desc: string }[] = [
  { key: "accounts", label: "สรุปตามบัญชี", icon: Scale, desc: "ยอดค่าใช้จ่ายแยกตามรหัสบัญชี (ไม่รวมเงินยืม)" },
  { key: "journal", label: "สมุดรายวันทั่วไป", icon: BookOpen, desc: "รายการบันทึกบัญชีเมื่ออนุมัติและเมื่อจ่ายเงิน" },
  { key: "vat", label: "รายงานภาษีซื้อ", icon: Receipt, desc: "ใบกำกับภาษีที่สแกนแล้ว — ขอคืนได้เฉพาะฉบับเต็มรูป" },
  { key: "advances", label: "เงินยืมคงค้าง", icon: Wallet, desc: "เงินทดรองจ่ายที่ยังไม่ปิดยอด แยกตามอายุ" },
  { key: "people", label: "สรุปรายพนักงาน", icon: Users, desc: "ยอดเบิกของพนักงานแต่ละคน" },
];

type JRow = { key: string; date: string; doc: string; code: string; name: string; desc: string; dr: number; cr: number; first: boolean };

/** สมุดรายวัน: อนุมัติ (ค่าใช้จ่าย/เงินทดรอง ↔ ค้างจ่าย) + จ่ายเงิน (ค้างจ่าย ↔ ธนาคาร) */
function journalRows(list: Expense[]): JRow[] {
  const out: JRow[] = [];
  const posted = list.filter((e) => ["approved", "awaiting_payment", "paid", "clearing", "cleared"].includes(e.status));
  for (const e of posted) {
    const at = e.history.find((h) => h.status === "approved")?.at ?? e.createdAt;
    journalFor(e).forEach((r, i) => out.push({ key: `${e.id}-a${i}`, date: at, doc: e.id, code: r.code, name: r.name, desc: `อนุมัติ: ${e.title}`, dr: r.dr, cr: r.cr, first: i === 0 }));
    if (e.payment) {
      out.push({ key: `${e.id}-p0`, date: e.payment.at, doc: e.id, ...LEDGER.accruedEmployee, desc: `จ่าย${e.payment.method} ${e.payment.ref}`, dr: e.total, cr: 0, first: true });
      out.push({ key: `${e.id}-p1`, date: e.payment.at, doc: e.id, ...LEDGER.bank, desc: `จ่าย${e.payment.method} ${e.payment.ref}`, dr: 0, cr: e.total, first: false });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.doc.localeCompare(b.doc) || a.key.localeCompare(b.key));
}

const money = (n: number) => (n ? <span className="tabular-nums">{baht(n)}</span> : <span className="text-slate-300">–</span>);

export default function ReportsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("accounts");
  const [period, setPeriod] = useState("2026-11");
  const meta = TABS.find((t) => t.key === tab)!;

  const accounts = byAccount(EXPENSES);
  const accTotal = accounts.reduce((a, r) => a + r.amount, 0);
  const journal = journalRows(EXPENSES);
  const dr = journal.reduce((a, r) => a + r.dr, 0);
  const cr = journal.reduce((a, r) => a + r.cr, 0);
  const vatTotal = VAT_INVOICES.reduce((a, r) => a + r.vat, 0);
  const vatClaimable = VAT_INVOICES.filter((r) => r.full).reduce((a, r) => a + r.vat, 0);
  const advances = EXPENSES.filter((e) => e.type === "advance" && (e.status === "clearing" || isOpenAdvance(e)));
  const people = topEmployees(EXPENSES, 99);

  /** แถบสรุปเหนือตาราง */
  const summary: { label: string; value: string; ok?: boolean }[] =
    tab === "accounts" ? [{ label: "จำนวนบัญชี", value: `${accounts.length}` }, { label: "ยอดรวมค่าใช้จ่าย", value: baht(accTotal) }]
    : tab === "journal" ? [{ label: "เดบิตรวม", value: baht(dr) }, { label: "เครดิตรวม", value: baht(cr) }, { label: "สถานะ", value: Math.abs(dr - cr) < 0.005 ? "สมดุล" : "ไม่สมดุล", ok: Math.abs(dr - cr) < 0.005 }]
    : tab === "vat" ? [{ label: "ภาษีซื้อทั้งหมด", value: baht(vatTotal) }, { label: "ขอคืนได้ (เต็มรูป)", value: baht(vatClaimable) }, { label: "ขอคืนไม่ได้ (ฉบับย่อ)", value: baht(vatTotal - vatClaimable) }]
    : tab === "advances" ? [{ label: "คงค้าง", value: `${advances.length} รายการ` }, { label: "ยอดรวม", value: baht(advances.reduce((a, e) => a + e.total, 0)) }]
    : [{ label: "พนักงานที่เบิก", value: `${people.length} คน` }, { label: "ยอดรวม", value: baht(people.reduce((a, p) => a + p.amount, 0)) }];

  return (
    <div className="space-y-5">
      <PageHeader title="รายงานทางบัญชี" subtitle="สรุปบัญชี · สมุดรายวัน · ภาษีซื้อ · เงินยืม · รายพนักงาน"
        actions={<>
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="งวด" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold" />
          <button onClick={() => window.print()} className="hidden h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:bg-slate-50 md:flex"><Printer size={16} /> พิมพ์</button>
          <button disabled title="เชื่อมต่อใน Phase 5" className="flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white opacity-60"><FileSpreadsheet size={16} /> Excel</button>
        </>} />

      {/* เลือกรายงาน */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ring-1 ring-inset transition ${tab === t.key ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* หัวรายงาน + สรุป */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <h2 className="flex items-center gap-2 font-bold"><meta.icon size={18} className="text-slate-400" /> {meta.label}</h2>
          <p className="text-xs text-slate-500">{meta.desc} · งวด {new Date(`${period}-01`).toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</p>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          {summary.map((s) => (
            <div key={s.label} className="text-right">
              <dt className="text-xs text-slate-500">{s.label}</dt>
              <dd className={`text-lg font-bold tabular-nums ${s.ok === false ? "text-rose-600" : s.ok ? "text-emerald-600" : ""}`}>
                {s.ok && <CheckCircle2 size={16} className="mr-1 inline" />}{s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {tab === "accounts" && (
        <DataTable rows={accounts} rowKey={(r) => r.code}
          columns={[
            { key: "code", header: "รหัสบัญชี", sort: (r) => r.code, cell: (r) => <span className="font-mono font-bold">{r.code}</span> },
            { key: "name", header: "ชื่อบัญชี", sort: (r) => r.name, cell: (r) => <span className="font-semibold">{r.name}</span> },
            { key: "count", header: "จำนวนรายการ", align: "right", sort: (r) => r.count, cell: (r) => r.count },
            { key: "share", header: "สัดส่วน", align: "right", sort: (r) => r.amount, cell: (r) => <span className="tabular-nums text-slate-500">{((r.amount / (accTotal || 1)) * 100).toFixed(1)}%</span> },
            { key: "amount", header: "ยอดเดบิต", align: "right", sort: (r) => r.amount, cell: (r) => <span className="text-[15px] font-bold tabular-nums">{baht(r.amount)}</span> },
          ]} />
      )}

      {tab === "journal" && (
        <DataTable rows={journal} rowKey={(r) => r.key} minWidth={960} defaultPageSize={20} onRowClick={(r) => router.push(`/admin/expenses/${r.doc}`)}
          columns={[
            { key: "date", header: "วันที่", sort: (r) => r.date, cell: (r) => (r.first ? <span className="whitespace-nowrap">{thDate(r.date)}</span> : null) },
            { key: "doc", header: "เลขที่เอกสาร", sort: (r) => r.doc, cell: (r) => (r.first ? <span className="font-mono text-xs font-bold">{r.doc}</span> : null) },
            { key: "code", header: "รหัสบัญชี", sort: (r) => r.code, cell: (r) => <span className={`font-mono ${r.cr ? "pl-6" : ""}`}>{r.code}</span> },
            { key: "name", header: "ชื่อบัญชี", cell: (r) => <span className={r.cr ? "pl-6" : "font-semibold"}>{r.name}</span> },
            { key: "desc", header: "คำอธิบาย", cell: (r) => <span className="text-xs text-slate-500">{r.desc}</span> },
            { key: "dr", header: "เดบิต", align: "right", sort: (r) => r.dr, cell: (r) => money(r.dr) },
            { key: "cr", header: "เครดิต", align: "right", sort: (r) => r.cr, cell: (r) => money(r.cr) },
          ]} />
      )}

      {tab === "vat" && (
        <DataTable rows={VAT_INVOICES} rowKey={(r) => r.docNo} minWidth={1000} onRowClick={(r) => router.push(`/admin/expenses/${r.expenseId}`)}
          columns={[
            { key: "date", header: "วันที่", sort: (r) => r.date, cell: (r) => <span className="whitespace-nowrap">{thDate(r.date)}</span> },
            { key: "doc", header: "เลขที่ใบกำกับ", sort: (r) => r.docNo, cell: (r) => <span className="font-mono text-xs font-bold">{r.docNo}</span> },
            { key: "vendor", header: "ผู้ขาย", sort: (r) => r.vendor, cell: (r) => <><p className="font-semibold">{r.vendor}</p><p className="text-xs text-slate-400">{r.expenseId}</p></> },
            {
              key: "tax", header: "เลขผู้เสียภาษี", cell: (r) => (
                <span className="inline-flex items-center gap-1 font-mono text-xs">
                  {r.taxId}{taxIdValid(r.taxId) ? <CheckCircle2 size={13} className="text-emerald-600" aria-label="ถูกต้อง" /> : <span className="font-sans font-bold text-rose-600">ไม่ถูกต้อง</span>}
                </span>
              ),
            },
            { key: "type", header: "ประเภท", sort: (r) => (r.full ? 0 : 1), cell: (r) => (r.full ? <span className="font-semibold">เต็มรูป</span> : <span className="text-slate-500">อย่างย่อ</span>) },
            { key: "base", header: "มูลค่าก่อนภาษี", align: "right", sort: (r) => r.base, cell: (r) => money(r.base) },
            { key: "vat", header: "ภาษีซื้อ", align: "right", sort: (r) => r.vat, cell: (r) => <span className={`font-bold tabular-nums ${r.full ? "" : "text-slate-400 line-through"}`}>{baht(r.vat)}</span> },
          ]} />
      )}

      {tab === "advances" && (
        <DataTable rows={advances} rowKey={(e) => e.id} minWidth={860} onRowClick={(e) => router.push(`/admin/expenses/${e.id}`)}
          columns={[
            { key: "doc", header: "เลขที่", sort: (e) => e.id, cell: (e) => <span className="font-mono text-xs font-bold">{e.id}</span> },
            { key: "emp", header: "พนักงาน", sort: (e) => e.employee, cell: (e) => <><p className="font-semibold">{e.employee}</p><p className="text-xs text-slate-400">{e.department}</p></> },
            { key: "paid", header: "วันที่จ่าย", sort: (e) => e.payment?.at ?? "", cell: (e) => (e.payment ? thDate(e.payment.at) : "–") },
            { key: "due", header: "กำหนดเคลียร์", sort: (e) => e.advanceDueDate ?? "", cell: (e) => (e.advanceDueDate ? thDate(e.advanceDueDate) : "–") },
            {
              key: "age", header: "อายุ", sort: (e) => -daysFromToday(e.advanceDueDate!), cell: (e) => {
                const d = daysFromToday(e.advanceDueDate!);
                return <span className={`font-bold ${d < 0 ? "text-rose-600" : d <= 3 ? "text-amber-600" : "text-slate-600"}`}>{d < 0 ? `เกิน ${-d} วัน` : `เหลือ ${d} วัน`}</span>;
              },
            },
            { key: "status", header: "สถานะ", cell: (e) => <StatusBadge status={e.status} /> },
            { key: "amt", header: "ยอดคงค้าง", align: "right", sort: (e) => e.total, cell: (e) => <span className="font-bold tabular-nums">{baht(e.total)}</span> },
          ]} />
      )}

      {tab === "people" && (
        <DataTable rows={people} rowKey={(p) => p.name}
          columns={[
            { key: "name", header: "พนักงาน", sort: (p) => p.name, cell: (p) => <span className="font-semibold">{p.name}</span> },
            { key: "dept", header: "แผนก", sort: (p) => p.dept, cell: (p) => p.dept },
            { key: "count", header: "จำนวนใบเบิก", align: "right", sort: (p) => p.count, cell: (p) => p.count },
            { key: "avg", header: "เฉลี่ยต่อใบ", align: "right", sort: (p) => p.amount / p.count, cell: (p) => money(p.amount / p.count) },
            { key: "amount", header: "ยอดรวม", align: "right", sort: (p) => p.amount, cell: (p) => <span className="text-[15px] font-bold tabular-nums">{baht(p.amount)}</span> },
          ]} />
      )}

      <p className="flex items-center gap-1.5 text-xs text-slate-400"><Landmark size={13} /> ผังบัญชีตั้งค่าได้ที่ ตั้งค่าระบบ → ภาษีและผังบัญชี และ หมวดค่าใช้จ่าย → รหัสบัญชี</p>
    </div>
  );
}
