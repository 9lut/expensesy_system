"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, CheckCircle2, Plus, Wallet } from "lucide-react";
import { CURRENT_USER, EXPENSES, daysFromToday, isOpenAdvance } from "@/lib/mock";
import { baht, thDate } from "@/lib/meta";
import type { Expense } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable } from "@/components/ui/DataTable";
import { Field, Input } from "@/components/ui/Field";
import { DesktopView, MobileView } from "@/components/ui/Responsive";

function DueLabel({ e }: { e: Expense }) {
  if (!isOpenAdvance(e)) return <span className="text-slate-400">–</span>;
  const d = daysFromToday(e.advanceDueDate!);
  const cls = d < 0 ? "text-rose-600" : d <= 3 ? "text-amber-600" : "text-slate-600";
  return <span className={`font-bold ${cls}`}>{d < 0 ? `เกินกำหนด ${-d} วัน` : `เหลือ ${d} วัน`}</span>;
}

/** ฟอร์มส่งเคลียร์เงินยืม (ใช้ทั้ง Sheet และ Modal) */
function ClearForm({ e, actual, setActual }: { e: Expense; actual: string; setActual: (v: string) => void }) {
  const diff = e.total - (parseFloat(actual) || 0);
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{e.id} · ยืม {baht(e.total)}</p>
      <Field label="ยอดใช้จริงรวม (บาท)"><Input inputMode="decimal" value={actual} onChange={(ev) => setActual(ev.target.value)} placeholder="0.00" /></Field>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 font-bold text-slate-500">
        <Camera size={20} /> แนบใบเสร็จจริง
        <input type="file" multiple accept="image/*,application/pdf" className="hidden" />
      </label>
      {actual && (
        <p className={`rounded-2xl p-4 text-sm font-bold ${diff > 0 ? "bg-amber-50 text-amber-800" : diff < 0 ? "bg-blue-50 text-blue-800" : "bg-emerald-50 text-emerald-800"}`}>
          {diff > 0 ? `ต้องคืนเงิน ${baht(diff)} (แนบสลิปคืนเงินด้วย)` : diff < 0 ? `เบิกเพิ่มได้ ${baht(-diff)}` : "ยอดพอดี ปิดยอดได้เลย"}
        </p>
      )}
    </div>
  );
}

export default function AdvancesPage() {
  const list = EXPENSES.filter((e) => e.employeeId === CURRENT_USER.id && e.type === "advance");
  const open = list.filter(isOpenAdvance);
  const [clearing, setClearing] = useState<Expense | null>(null);
  const [actual, setActual] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const close = () => { setClearing(null); setActual(""); };
  const submit = () => { if (clearing) setSent([...sent, clearing.id]); close(); };

  return (
    <>
      <MobileView>
        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-lg shadow-orange-500/20">
            <p className="text-sm text-white/80">เงินยืมที่ยังไม่เคลียร์</p>
            <p className="text-3xl font-bold tabular-nums">{baht(open.reduce((a, e) => a + e.total, 0))}</p>
            <p className="mt-1 text-sm text-white/80">{open.length} รายการ</p>
          </div>
          {list.length === 0 && <EmptyState text="ยังไม่มีเงินยืม" />}
          {list.map((e) => (
            <div key={e.id} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
              <Link href={`/expenses/${e.id}`} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">{e.title}</p>
                  <p className="text-xs text-slate-500">{e.id}</p>
                </div>
                <p className="text-lg font-bold tabular-nums">{baht(e.total)}</p>
              </Link>
              <div className="flex items-center justify-between text-sm">
                {sent.includes(e.id) ? <span className="inline-flex items-center gap-1 font-bold text-cyan-700"><CheckCircle2 size={16} /> ส่งเคลียร์แล้ว</span> : <StatusBadge status={e.status} />}
                <DueLabel e={e} />
              </div>
              {isOpenAdvance(e) && !sent.includes(e.id) && (
                <button onClick={() => setClearing(e)} className="w-full rounded-2xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-600/25">ส่งเคลียร์เงินยืม</button>
              )}
            </div>
          ))}
          <Link href="/new" className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-300 py-3.5 font-bold text-blue-600">
            <Plus size={18} /> ขอยืมเงินใหม่
          </Link>
        </div>
        <Dialog variant="sheet" open={!!clearing} onClose={close} title="ส่งเคลียร์เงินยืม"
          footer={<button disabled={!actual} onClick={submit} className="w-full rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white disabled:opacity-40">ส่งเคลียร์</button>}>
          {clearing && <ClearForm e={clearing} actual={actual} setActual={setActual} />}
        </Dialog>
      </MobileView>

      <DesktopView>
        <div className="space-y-6">
          <PageHeader title="เงินยืมของฉัน" subtitle={`ค้างเคลียร์ ${open.length} รายการ · ${baht(open.reduce((a, e) => a + e.total, 0))}`}
            actions={<Link href="/new" className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20"><Plus size={18} /> ขอยืมเงิน</Link>} />
          <DataTable rows={list} rowKey={(e) => e.id} empty="ยังไม่มีเงินยืม" minWidth={820}
            columns={[
              { key: "title", header: "เลขที่ / หัวข้อ", sort: (e) => e.title, cell: (e) => <><Link href={`/expenses/${e.id}`} className="font-bold hover:text-blue-600">{e.title}</Link><div className="text-xs text-slate-400">{e.id}</div></> },
              { key: "paid", header: "วันที่รับเงิน", sort: (e) => e.payment?.at ?? "", cell: (e) => (e.payment ? thDate(e.payment.at) : "–") },
              { key: "due", header: "กำหนดส่งใบเสร็จ", sort: (e) => e.advanceDueDate ?? "", cell: (e) => (e.advanceDueDate ? thDate(e.advanceDueDate) : "–") },
              { key: "left", header: "เหลือเวลา", cell: (e) => <DueLabel e={e} /> },
              { key: "status", header: "สถานะ", sort: (e) => e.status, cell: (e) => <StatusBadge status={sent.includes(e.id) ? "clearing" : e.status} /> },
              { key: "total", header: "ยอดยืม", align: "right", sort: (e) => e.total, cell: (e) => <span className="font-bold tabular-nums">{baht(e.total)}</span> },
              {
                key: "act", header: "", align: "right",
                cell: (e) => isOpenAdvance(e) && !sent.includes(e.id) && (
                  <button onClick={() => setClearing(e)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white"><Wallet size={14} /> ส่งเคลียร์</button>
                ),
              },
            ]} />
        </div>
        <Dialog variant="modal" open={!!clearing} onClose={close} title="ส่งเคลียร์เงินยืม"
          footer={<div className="flex justify-end gap-2"><button onClick={close} className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600">ยกเลิก</button><button disabled={!actual} onClick={submit} className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white disabled:opacity-40">ส่งเคลียร์</button></div>}>
          {clearing && <ClearForm e={clearing} actual={actual} setActual={setActual} />}
        </Dialog>
      </DesktopView>
    </>
  );
}
