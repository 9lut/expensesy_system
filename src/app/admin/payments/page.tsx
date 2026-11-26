"use client";

import { useState } from "react";
import { BadgeCheck, Banknote, CheckCircle2, FileCheck2, Paperclip, Undo2, Upload } from "lucide-react";
import { EXPENSES, WEEKLY_PAID } from "@/lib/mock";
import { SimpleBars } from "@/components/charts/Charts";
import { baht } from "@/lib/meta";
import type { Expense } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Field, Input } from "@/components/ui/Field";
import { DesktopView, MobileView } from "@/components/ui/Responsive";
import { StepTabs, type Step } from "@/components/admin/StepTabs";
import { BankBox } from "@/components/admin/BankBox";
import { ReviewPanel } from "@/components/admin/ReviewPanel";

type K = "verify" | "pay" | "done";
type Paid = Expense & { method: string };

const receipts = (e: Expense) => e.items.reduce((a, i) => a + i.receipts, 0);
const sum = (l: Expense[]) => l.reduce((a, e) => a + e.total, 0);

/** สถานะงานจ่ายเงิน (จำลองในหน่วยความจำ) */
function usePayments() {
  const [list, setList] = useState(EXPENSES.filter((e) => e.status === "approved" || e.status === "awaiting_payment"));
  const [done, setDone] = useState<Paid[]>([]);
  const [toast, setToast] = useState("");
  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };
  return {
    verifyList: list.filter((e) => e.status === "approved"),
    payList: list.filter((e) => e.status === "awaiting_payment"),
    done,
    toast,
    verify: (ids: string[]) => {
      setList((l) => l.map((e) => (ids.includes(e.id) ? { ...e, status: "awaiting_payment" as const } : e)));
      flash(`เอกสารครบ ${ids.length} รายการ → ย้ายไปรอโอน`);
    },
    sendBack: (id: string) => { setList((l) => l.filter((e) => e.id !== id)); flash("ส่งกลับให้พนักงานแก้ไขแล้ว"); },
    pay: (ids: string[], method: string) => {
      setDone((d) => [...list.filter((e) => ids.includes(e.id)).map((e) => ({ ...e, method })), ...d]);
      setList((l) => l.filter((e) => !ids.includes(e.id)));
      flash(`บันทึกจ่ายแล้ว ${ids.length} รายการ · แจ้งพนักงานทาง LINE แล้ว`);
    },
  };
}

function Toast({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="fixed left-1/2 top-4 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-xl">
      <CheckCircle2 size={18} className="text-emerald-400" /> {text}
    </div>
  );
}

/** ฟอร์มบันทึกการโอน — รองรับหลายรายการพร้อมกัน */
function PayForm({ items, method, setMethod }: { items: Expense[]; method: string; setMethod: (m: string) => void }) {
  const [slip, setSlip] = useState<string>();
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-blue-50 p-4">
        <p className="text-sm text-blue-800">ยอดที่ต้องโอน ({items.length} รายการ)</p>
        <p className="text-3xl font-bold tabular-nums text-blue-700">{baht(sum(items))}</p>
      </div>
      {items.length === 1 ? <BankBox employeeId={items[0].employeeId} /> : (
        <ul className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200">
          {items.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="min-w-0"><span className="block font-bold">{e.employee}</span><BankBox employeeId={e.employeeId} compact /></span>
              <span className="font-bold tabular-nums">{baht(e.total)}</span>
            </li>
          ))}
        </ul>
      )}
      <div>
        <p className="mb-1.5 text-sm font-bold text-slate-700">จ่ายด้วย</p>
        <div className="grid grid-cols-3 gap-2">
          {["โอนเงิน", "เงินสด", "เช็ค"].map((m) => (
            <button key={m} type="button" onClick={() => setMethod(m)}
              className={`h-11 rounded-xl text-sm font-bold ring-1 ${method === m ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-600 ring-slate-200"}`}>{m}</button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="วันที่จ่าย"><Input type="date" defaultValue="2026-11-25" /></Field>
        <Field label="เลขอ้างอิง (ถ้ามี)"><Input placeholder="เช่น KB-88213" /></Field>
      </div>
      <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-500 hover:border-blue-300">
        <Upload size={18} /> {slip ?? "แนบสลิป (ถ้ามี)"}
        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(ev) => setSlip(ev.target.files?.[0]?.name)} />
      </label>
    </div>
  );
}

function steps(p: ReturnType<typeof usePayments>): Step<K>[] {
  return [
    { key: "verify", icon: FileCheck2, title: "ตรวจเอกสาร", hint: "เช็กใบเสร็จให้ครบ", count: p.verifyList.length, amount: sum(p.verifyList), tone: "bg-amber-50 text-amber-600" },
    { key: "pay", icon: Banknote, title: "รอโอนเงิน", hint: "โอนแล้วกดบันทึก", count: p.payList.length, amount: sum(p.payList), tone: "bg-blue-50 text-blue-600" },
    { key: "done", icon: BadgeCheck, title: "จ่ายแล้ววันนี้", hint: "แจ้งพนักงานแล้ว", count: p.done.length, amount: sum(p.done), tone: "bg-emerald-50 text-emerald-600" },
  ];
}

/* ───────────────────────── มือถือ ───────────────────────── */
function MobilePayments() {
  const p = usePayments();
  const [tab, setTab] = useState<K>("verify");
  const [review, setReview] = useState<Expense | null>(null);
  const [paying, setPaying] = useState<Expense | null>(null);
  const [method, setMethod] = useState("โอนเงิน");
  const list = tab === "verify" ? p.verifyList : tab === "pay" ? p.payList : p.done;

  return (
    <div className="space-y-4">
      <Toast text={p.toast} />
      <StepTabs steps={steps(p)} value={tab} onChange={setTab} />
      {list.length === 0 && <EmptyState text={tab === "done" ? "ยังไม่มีรายการที่จ่ายวันนี้" : "ไม่มีงานค้าง 🎉"} />}
      {list.map((e) => (
        <div key={e.id} className="space-y-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-bold">{e.employee}</p>
              <p className="truncate text-xs text-slate-500">{e.title} · <Paperclip size={11} className="inline" /> {receipts(e)}</p>
            </div>
            <p className="text-lg font-bold tabular-nums">{baht(e.total)}</p>
          </div>
          {tab === "verify" && (
            <button onClick={() => setReview(e)} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 font-bold text-white"><FileCheck2 size={18} /> ตรวจเอกสาร</button>
          )}
          {tab === "pay" && (
            <>
              <BankBox employeeId={e.employeeId} />
              <button onClick={() => setPaying(e)} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-bold text-white"><BadgeCheck size={18} /> โอนแล้ว</button>
            </>
          )}
          {tab === "done" && <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-600"><BadgeCheck size={16} /> จ่ายแล้ว · {(e as Paid).method}</p>}
        </div>
      ))}

      <Dialog variant="sheet" open={!!review} onClose={() => setReview(null)} title="ตรวจเอกสาร"
        footer={
          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <button onClick={() => { if (review) p.sendBack(review.id); setReview(null); }} className="flex h-14 items-center justify-center gap-1.5 rounded-2xl border border-violet-200 font-bold text-violet-700"><Undo2 size={18} /> ส่งกลับ</button>
            <button onClick={() => { if (review) p.verify([review.id]); setReview(null); }} className="flex h-14 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 font-bold text-white"><FileCheck2 size={18} /> เอกสารครบ</button>
          </div>
        }>
        {review && <ReviewPanel e={review} />}
      </Dialog>
      <Dialog variant="sheet" open={!!paying} onClose={() => setPaying(null)} title="บันทึกการจ่ายเงิน"
        footer={<button onClick={() => { if (paying) p.pay([paying.id], method); setPaying(null); }} className="h-14 w-full rounded-2xl bg-emerald-600 text-lg font-bold text-white">ยืนยันจ่ายแล้ว</button>}>
        {paying && <PayForm items={[paying]} method={method} setMethod={setMethod} />}
      </Dialog>
    </div>
  );
}

/* ───────────────────────── คอม ───────────────────────── */
function DesktopPayments() {
  const p = usePayments();
  const [tab, setTab] = useState<K>("verify");
  const [selected, setSelected] = useState<string[]>([]);
  const [review, setReview] = useState<Expense | null>(null);
  const [paying, setPaying] = useState<Expense[]>([]);
  const [method, setMethod] = useState("โอนเงิน");
  const list = tab === "verify" ? p.verifyList : p.payList;
  const chosen = list.filter((e) => selected.includes(e.id));
  const changeTab = (k: K) => { setTab(k); setSelected([]); };

  const base: Column<Expense>[] = [
    { key: "employee", header: "พนักงาน", sort: (e) => e.employee, cell: (e) => <><p className="font-bold">{e.employee}</p><p className="text-xs text-slate-400">{e.department}</p></> },
    { key: "title", header: "ใบเบิก", sort: (e) => e.title, cell: (e) => <><p>{e.title}</p><p className="text-xs text-slate-400">{e.id}</p></> },
  ];
  const amount: Column<Expense> = { key: "total", header: "ยอดเงิน", align: "right", sort: (e) => e.total, cell: (e) => <span className="font-bold tabular-nums">{baht(e.total)}</span> };

  const verifyCols: Column<Expense>[] = [
    ...base,
    { key: "approver", header: "อนุมัติโดย", sort: (e) => e.approver ?? "", cell: (e) => e.approver },
    { key: "receipts", header: "ใบเสร็จ", align: "center", sort: receipts, cell: (e) => <span className="inline-flex items-center gap-1 text-slate-500"><Paperclip size={13} />{receipts(e)}</span> },
    amount,
    { key: "act", header: "", align: "right", cell: (e) => <button onClick={() => setReview(e)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white"><FileCheck2 size={14} /> ตรวจเอกสาร</button> },
  ];
  const payCols: Column<Expense>[] = [
    ...base,
    { key: "bank", header: "บัญชีรับเงิน", cell: (e) => <BankBox employeeId={e.employeeId} compact /> },
    amount,
    { key: "act", header: "", align: "right", cell: (e) => <button onClick={() => setPaying([e])} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white"><BadgeCheck size={14} /> โอนแล้ว</button> },
  ];
  const doneCols: Column<Paid>[] = [
    { key: "employee", header: "พนักงาน", sort: (e) => e.employee, cell: (e) => <span className="font-bold">{e.employee}</span> },
    { key: "title", header: "ใบเบิก", sort: (e) => e.title, cell: (e) => <>{e.title}<p className="text-xs text-slate-400">{e.id}</p></> },
    { key: "method", header: "จ่ายด้วย", sort: (e) => e.method, cell: (e) => e.method },
    { key: "total", header: "ยอดเงิน", align: "right", sort: (e) => e.total, cell: (e) => <span className="font-bold tabular-nums text-emerald-600">{baht(e.total)}</span> },
  ];

  return (
    <div className="space-y-6">
      <Toast text={p.toast} />
      <PageHeader title="จ่ายเงิน" subtitle="ตรวจเอกสาร → โอนเงิน → เสร็จ (ระบบแจ้งพนักงานทาง LINE ทุกขั้น)" />
      <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:grid-cols-[1fr_260px]">
        <div>
          <h2 className="text-sm font-bold">ยอดจ่ายเงินรายสัปดาห์</h2>
          <p className="mb-3 text-xs text-slate-400">8 สัปดาห์ล่าสุด (แท่งเข้ม = สัปดาห์นี้)</p>
          <SimpleBars data={WEEKLY_PAID} height={170} />
        </div>
        <dl className="grid content-center gap-3 text-sm xl:border-l xl:border-slate-100 xl:pl-5">
          <div><dt className="text-xs text-slate-500">จ่ายแล้ว 8 สัปดาห์</dt><dd className="text-2xl font-bold tabular-nums">{baht(WEEKLY_PAID.reduce((a, w) => a + w.total, 0))}</dd></div>
          <div><dt className="text-xs text-slate-500">เฉลี่ยต่อสัปดาห์</dt><dd className="font-bold tabular-nums">{baht(WEEKLY_PAID.reduce((a, w) => a + w.total, 0) / WEEKLY_PAID.length)}</dd></div>
          <div><dt className="text-xs text-slate-500">รอโอนตอนนี้</dt><dd className="font-bold tabular-nums">{baht(sum(p.payList))}</dd></div>
        </dl>
      </section>
      <StepTabs steps={steps(p)} value={tab} onChange={changeTab} />

      {tab !== "done" && chosen.length > 0 && (
        <div className="sticky top-0 z-10 flex items-center gap-4 rounded-2xl bg-slate-900 px-5 py-3 text-white shadow-lg">
          <span className="font-bold">เลือก {chosen.length} รายการ</span>
          <span className="text-white/70">รวม <b className="tabular-nums text-white">{baht(sum(chosen))}</b></span>
          <button onClick={() => setSelected([])} className="ml-auto text-sm text-white/70 hover:text-white">ยกเลิกการเลือก</button>
          {tab === "verify" ? (
            <button onClick={() => { p.verify(selected); setSelected([]); }} className="flex h-10 items-center gap-1.5 rounded-xl bg-blue-500 px-4 text-sm font-bold"><FileCheck2 size={16} /> เอกสารครบทั้งหมด</button>
          ) : (
            <button onClick={() => setPaying(chosen)} className="flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-bold"><BadgeCheck size={16} /> บันทึกว่าโอนแล้ว</button>
          )}
        </div>
      )}

      {tab === "verify" && <DataTable rows={p.verifyList} columns={verifyCols} rowKey={(e) => e.id} onRowClick={setReview} selection={{ selected, onChange: setSelected }} empty="ไม่มีเอกสารรอตรวจ 🎉" minWidth={860} />}
      {tab === "pay" && <DataTable rows={p.payList} columns={payCols} rowKey={(e) => e.id} onRowClick={(e) => setPaying([e])} selection={{ selected, onChange: setSelected }} empty="ไม่มีรายการรอโอน 🎉" minWidth={860} />}
      {tab === "done" && <DataTable rows={p.done} columns={doneCols} rowKey={(e) => e.id} empty="ยังไม่มีรายการที่จ่ายวันนี้" />}

      <Dialog variant="modal" open={!!review} onClose={() => setReview(null)} title="ตรวจเอกสาร"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => { if (review) p.sendBack(review.id); setReview(null); }} className="flex h-11 items-center gap-1.5 rounded-xl border border-violet-200 px-4 font-bold text-violet-700"><Undo2 size={16} /> ส่งกลับแก้ไข</button>
            <button onClick={() => { if (review) p.verify([review.id]); setReview(null); }} className="flex h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-5 font-bold text-white"><FileCheck2 size={16} /> เอกสารครบ → รอโอน</button>
          </div>
        }>
        {review && <ReviewPanel e={review} />}
      </Dialog>
      <Dialog variant="modal" open={paying.length > 0} onClose={() => setPaying([])} title="บันทึกการจ่ายเงิน"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setPaying([])} className="h-11 rounded-xl border border-slate-200 px-4 font-bold text-slate-600">ยกเลิก</button>
            <button onClick={() => { p.pay(paying.map((e) => e.id), method); setSelected([]); setPaying([]); }} className="h-11 rounded-xl bg-emerald-600 px-5 font-bold text-white">ยืนยันจ่ายแล้ว</button>
          </div>
        }>
        {paying.length > 0 && <PayForm items={paying} method={method} setMethod={setMethod} />}
      </Dialog>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <>
      <MobileView><MobilePayments /></MobileView>
      <DesktopView><DesktopPayments /></DesktopView>
    </>
  );
}
