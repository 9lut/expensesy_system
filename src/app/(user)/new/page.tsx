"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowLeft, ArrowRight, BedDouble, CalendarDays, Camera, CarTaxiFront, Check, CheckCircle2, Fuel, HandCoins, Handshake,
  Keyboard, MoreHorizontal, Package, Paperclip, PenLine, Plus, Route, Save, ScanLine, ScanText, Send, Smartphone, SquareParking,
  Ticket, Trash2, Upload, UtensilsCrossed, type LucideIcon,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { ReceiptScanner, type ScanResult } from "@/components/receipt/ReceiptScanner";
import { CATEGORIES, CURRENT_ADMIN } from "@/lib/mock";
import { TYPE_META, baht } from "@/lib/meta";
import type { Expense, ExpenseType } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Field, Input } from "@/components/ui/Field";
import { thCls } from "@/components/ui/table-styles";
import { DesktopView, MobileView } from "@/components/ui/Responsive";

/* ───────────────────────── เมนูด่วน ───────────────────────── */
/** แตะแล้วเปิดกล้อง/เลือกไฟล์ โดยกำหนดหมวดไว้ล่วงหน้า · manual = ไม่มีใบเสร็จ (เพิ่มแถวให้กรอกเอง) */
const QUICK: { label: string; icon: LucideIcon; cat: string; manual?: boolean }[] = [
  { label: "ค่าน้ำมัน", icon: Fuel, cat: "ค่าน้ำมัน" },
  { label: "ทางด่วน", icon: Route, cat: "ค่าทางด่วน / ที่จอดรถ" },
  { label: "ที่จอดรถ", icon: SquareParking, cat: "ค่าทางด่วน / ที่จอดรถ" },
  { label: "แท็กซี่ / Grab", icon: CarTaxiFront, cat: "ค่าแท็กซี่ / รถรับจ้าง" },
  { label: "ตั๋วเดินทาง", icon: Ticket, cat: "ค่าตั๋วเดินทาง" },
  { label: "ที่พัก", icon: BedDouble, cat: "ค่าที่พัก" },
  { label: "เบี้ยเลี้ยง", icon: CalendarDays, cat: "ค่าเบี้ยเลี้ยง", manual: true },
  { label: "ค่าอาหาร", icon: UtensilsCrossed, cat: "ค่าอาหาร / รับรอง" },
  { label: "รับรองลูกค้า", icon: Handshake, cat: "ค่าอาหาร / รับรอง" },
  { label: "วัสดุสำนักงาน", icon: PenLine, cat: "วัสดุสำนักงาน" },
  { label: "ไปรษณีย์ / ขนส่ง", icon: Package, cat: "ค่าไปรษณีย์ / ขนส่ง" },
  { label: "โทรศัพท์ / เน็ต", icon: Smartphone, cat: "ค่าโทรศัพท์ / อินเทอร์เน็ต" },
  { label: "อื่น ๆ", icon: MoreHorizontal, cat: "อื่น ๆ" },
];
const EXPENSE_CATS = CATEGORIES.filter((c) => c.active && c.appliesTo.some((t) => t !== "advance"));
const cat = (name: string) => CATEGORIES.find((c) => c.name === name);
const catIcon = (name: string) => QUICK.find((q) => q.cat === name)?.icon ?? Paperclip;

/** วันนี้ (เวลาไทย) YYYY-MM-DD */
const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });

/** อัปโหลดไฟล์ใบเสร็จ → รหัสไฟล์ */
async function upload(f: File): Promise<string> {
  const form = new FormData();
  form.append("file", f);
  const j = await (await fetch("/api/uploads", { method: "POST", body: form })).json();
  if (!j.ok) throw new Error(`อัปโหลด ${f.name} ไม่สำเร็จ: ${j.error}`);
  return j.data.id;
}

interface Row {
  date: string; description: string; category: string; amount: string; files: number;
  /** ไฟล์ใบเสร็จที่เลือกไว้ (อัปโหลดตอนกดส่ง) */
  fileObjs?: File[];
  /** ผู้ใช้ตรวจกรอบ OCR และยืนยันแล้ว */
  verified?: boolean;
  /** ยอดที่ OCR อ่านได้ (ไว้เตือนเมื่อยอดที่กรอกไม่ตรง) */
  ocrTotal?: number;
}

const mismatch = (r: Row) => !!r.verified && r.ocrTotal !== undefined && Math.abs((parseFloat(r.amount) || 0) - r.ocrTotal) > 0.009;

/** สถานะฟอร์ม — เริ่มจากสแกน: แต่ละใบเสร็จกลายเป็น 1 แถว ประเภทใบเบิกคำนวณจากหมวดอัตโนมัติ */
function useDraft() {
  const [mode, setMode] = useState<"expense" | "advance">("expense");
  const [title, setTitle] = useState("");
  const [typeOverride, setTypeOverride] = useState<ExpenseType | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [advance, setAdvance] = useState({ amount: "", date: today(), note: "" });

  // ประเภทอัตโนมัติ: มีหมวดที่เป็นค่าเดินทางล้วน → ค่าเดินทาง, ไม่งั้น → ทั่วไป
  const autoType: ExpenseType = rows.some((r) => { const c = cat(r.category); return c?.appliesTo.includes("travel") && !c.appliesTo.includes("general"); }) ? "travel" : "general";
  const type: ExpenseType = mode === "advance" ? "advance" : typeOverride ?? autoType;
  const month = new Date().toLocaleDateString("th-TH", { month: "short", year: "2-digit" });
  const suggestedTitle = mode === "advance" ? "" : rows.length ? `${TYPE_META[type].label} ${rows[0].description ? `· ${rows[0].description}` : ""} ${month}`.replace(/\s+/g, " ").trim() : "";

  const setRow = (i: number, p: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const removeRow = (i: number) => setRows(rows.filter((_, j) => j !== i));
  const addManual = (category = "อื่น ๆ") => setRows([...rows, { date: today(), description: "", category, amount: "", files: 0 }]);

  const total = mode === "advance" ? parseFloat(advance.amount) || 0 : rows.reduce((a, r) => a + (parseFloat(r.amount) || 0), 0);
  const missingReceipt = rows.filter((r) => cat(r.category)?.receiptRequired && r.files === 0).length;
  const overLimit = rows.filter((r) => { const c = cat(r.category); return c?.limit && parseFloat(r.amount) > c.limit; }).length;
  const verifiedCount = rows.filter((r) => r.verified).length;
  const finalTitle = title.trim() || suggestedTitle;
  const valid = mode === "advance"
    ? !!title.trim() && total > 0
    : !!finalTitle && rows.length > 0 && rows.every((r) => r.description && parseFloat(r.amount) > 0) && missingReceipt === 0;

  // คิวสแกน: เลือกหลายไฟล์ได้ (คอม) — ตรวจทีละใบ
  const [queue, setQueue] = useState<{ files: File[]; preset?: string; row?: number } | null>(null);
  const current = queue?.files[0];
  const enqueue = (files: File[], preset?: string, row?: number) => { if (files.length) setQueue({ files, preset, row }); };
  const applyScan = (s: ScanResult) => {
    if (!queue) return;
    const r: Row = {
      date: s.date ?? today(), description: s.vendor ?? s.category, category: s.category,
      amount: s.amount ? String(s.amount) : "", files: 1, verified: true, ocrTotal: s.ocrTotal, fileObjs: [queue.files[0]],
    };
    if (queue.row !== undefined) {
      const old = rows[queue.row];
      setRow(queue.row, { ...r, description: old.description || r.description, files: old.files + 1, fileObjs: [...(old.fileObjs ?? []), queue.files[0]] });
    } else {
      setRows((l) => [...l, r]);
    }
    const rest = queue.files.slice(1);
    setQueue(rest.length ? { ...queue, files: rest, row: undefined } : null);
  };
  const skipScan = () => { const rest = queue?.files.slice(1) ?? []; setQueue(rest.length ? { ...queue!, files: rest } : null); };

  // ส่งเข้า API: อัปโหลดใบเสร็จ → สร้างใบเบิก (asDraft = บันทึกร่าง)
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Expense | null>(null);
  const send = async (asDraft = false) => {
    setSending(true);
    setError(null);
    try {
      let payload: unknown;
      if (mode === "advance") {
        payload = { kind: "advance", title: title.trim(), amount: total, neededDate: advance.date, note: advance.note.trim() || undefined, submit: !asDraft };
      } else {
        const items = [];
        for (const r of rows) {
          const receiptIds: string[] = [];
          for (const f of r.fileObjs ?? []) receiptIds.push(await upload(f));
          items.push({ date: r.date, description: r.description.trim(), category: r.category, amount: parseFloat(r.amount), receiptIds, ...(r.ocrTotal !== undefined ? { ocrTotal: r.ocrTotal } : {}) });
        }
        payload = { kind: "expense", ...(typeOverride && typeOverride !== "advance" ? { type: typeOverride } : {}), title: finalTitle, items, submit: !asDraft };
      }
      const res = await fetch("/api/expenses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error);
      setSaved(j.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSending(false);
    }
  };

  return {
    mode, setMode, title, setTitle, suggestedTitle, finalTitle, type, autoType, typeOverride, setTypeOverride,
    rows, setRow, removeRow, clearRows: () => setRows([]), addManual, advance, setAdvance, total, missingReceipt, overLimit, verifiedCount, valid,
    queue, current, enqueue, applyScan, skipScan,
    sending, error, saved, send,
  };
}
type Draft = ReturnType<typeof useDraft>;

/** ช่องเลือกไฟล์ซ่อน + ฟังก์ชันเปิด (กล้อง / ไฟล์) พร้อมหมวดที่กำหนดล่วงหน้า */
function usePicker(d: Draft) {
  const camRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pending = useRef<{ preset?: string; row?: number }>({});
  const open = (kind: "camera" | "file", preset?: string, row?: number) => {
    pending.current = { preset, row };
    (kind === "camera" ? camRef : fileRef).current?.click();
  };
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    d.enqueue(files, pending.current.preset, pending.current.row);
  };
  const inputs = (
    <>
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onChange} />
      <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={onChange} />
    </>
  );
  return { open, inputs };
}

function Done({ e }: { e: Expense }) {
  const draft = e.status === "draft";
  return (
    <div className="grid place-items-center gap-3 rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200/70">
      <CheckCircle2 size={64} className="text-emerald-600" />
      <h1 className="text-xl font-bold">{draft ? "บันทึกร่างแล้ว" : e.type === "advance" ? "ส่งคำขอยืมเงินเรียบร้อย" : "ส่งใบเบิกเรียบร้อย"}</h1>
      <p className="text-sm text-slate-500">
        เลขที่ <b className="text-slate-800">{e.id}</b> · {baht(e.total)}
        {!draft && e.approver && <><br />รออนุมัติจาก {e.approver}</>}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Link href={`/expenses/${e.id}`} className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-600/25">ดูใบเบิกนี้</Link>
        <button onClick={() => window.location.reload()} className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50">สร้างใบใหม่</button>
      </div>
    </div>
  );
}

/** ข้อความผิดพลาดตอนส่ง */
const SendError = ({ d }: { d: Draft }) =>
  d.error ? <p role="alert" className="flex items-center gap-1.5 text-sm font-bold text-rose-600"><AlertTriangle size={15} /> {d.error}</p> : null;

/** หมวด → ประเภท (แสดงคู่กับตัวเลือก) */
function TypePicker({ d }: { d: Draft }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">ประเภท</span>
      <select value={d.typeOverride ?? "auto"} onChange={(e) => d.setTypeOverride(e.target.value === "auto" ? null : (e.target.value as ExpenseType))}
        className="h-9 rounded-lg border border-slate-200 bg-white px-2 font-bold outline-none focus:ring-2 focus:ring-blue-100">
        <option value="auto">{TYPE_META[d.autoType].label} (อัตโนมัติ)</option>
        <option value="travel">{TYPE_META.travel.label}</option>
        <option value="general">{TYPE_META.general.label}</option>
      </select>
    </div>
  );
}

/** ฟอร์มขอยืมเงิน (ไม่มีใบเสร็จ) */
function AdvanceForm({ d }: { d: Draft }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2"><Field label="ยืมไปใช้ทำอะไร"><Input value={d.title} onChange={(e) => d.setTitle(e.target.value)} placeholder="เช่น ค่าใช้จ่ายงานสัมมนาที่เชียงใหม่" /></Field></div>
      <Field label="จำนวนเงินที่ขอยืม (บาท)"><Input inputMode="decimal" value={d.advance.amount} onChange={(e) => d.setAdvance({ ...d.advance, amount: e.target.value })} placeholder="0.00" className="text-right text-lg font-bold tabular-nums" /></Field>
      <Field label="วันที่ต้องการใช้เงิน"><Input type="date" value={d.advance.date} onChange={(e) => d.setAdvance({ ...d.advance, date: e.target.value })} /></Field>
      <div className="md:col-span-2"><Field label="รายละเอียดเพิ่มเติม (ไม่บังคับ)"><Input value={d.advance.note} onChange={(e) => d.setAdvance({ ...d.advance, note: e.target.value })} placeholder="ประมาณการค่าใช้จ่าย" /></Field></div>
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200 md:col-span-2">ต้องส่งใบเสร็จเคลียร์ภายใน 15 วันหลังได้รับเงิน (หน้า “เงินยืม”)</p>
    </div>
  );
}

/* ───────────────────────── มือถือ ───────────────────────── */
function MobileCreate() {
  const d = useDraft();
  const pick = usePicker(d);
  if (d.saved) return <Done e={d.saved} />;

  const scanDialog = (
    <Dialog variant="sheet" open={!!d.current} onClose={d.skipScan} title={d.queue && d.queue.files.length > 1 ? `ตรวจใบเสร็จ (เหลือ ${d.queue.files.length})` : "ตรวจใบเสร็จ"}>
      {d.current && <ReceiptScanner key={d.current.name + d.current.lastModified + d.queue!.files.length} file={d.current} layout="stack" presetCategory={d.queue!.preset} onConfirm={d.applyScan} onRetake={d.skipScan} />}
    </Dialog>
  );

  // หน้าเริ่ม: สแกนก่อน
  if (d.mode === "expense" && d.rows.length === 0) {
    return (
      <div className="space-y-5">
        {pick.inputs}
        <button onClick={() => pick.open("camera")} className="relative flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 p-5 text-left text-white shadow-lg shadow-blue-600/25 active:scale-[.99]">
          <ScanLine size={40} className="shrink-0" />
          <span>
            <span className="block text-lg font-bold">สแกนใบเสร็จ</span>
            <span className="text-sm text-white/80">ระบบอ่านยอด วันที่ และจัดหมวดให้อัตโนมัติ</span>
          </span>
        </button>
        <button onClick={() => pick.open("file")} className="-mt-2 flex w-full items-center justify-center gap-1.5 text-sm font-bold text-slate-500">
          <Upload size={15} /> หรือเลือกไฟล์รูป / PDF (เลือกหลายใบได้)
        </button>

        <section>
          <h2 className="mb-2.5 text-sm font-bold text-slate-500">เมนูด่วน — แตะแล้วถ่ายใบเสร็จได้เลย</h2>
          <div className="grid grid-cols-4 gap-2">
            {QUICK.map((q) => (
              <button key={q.label} onClick={() => (q.manual ? d.addManual(q.cat) : pick.open("camera", q.cat))}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-white px-1 py-3 text-center text-[11px] font-bold leading-tight text-slate-700 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50">
                <q.icon size={22} className="text-blue-600" /> {q.label}
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => d.setMode("advance")} className="flex items-center gap-2.5 rounded-xl bg-white p-3.5 text-left text-sm font-bold shadow-sm ring-1 ring-slate-200/70">
            <HandCoins size={22} className="shrink-0 text-amber-600" /> ขอยืมเงินล่วงหน้า
          </button>
          <button onClick={() => d.addManual()} className="flex items-center gap-2.5 rounded-xl bg-white p-3.5 text-left text-sm font-bold shadow-sm ring-1 ring-slate-200/70">
            <Keyboard size={22} className="shrink-0 text-slate-500" /> กรอกเอง (ไม่มีใบเสร็จ)
          </button>
        </div>
        {scanDialog}
      </div>
    );
  }

  // ขอยืมเงิน
  if (d.mode === "advance") {
    return (
      <div className="space-y-4">
        <button onClick={() => d.setMode("expense")} className="flex items-center gap-1 text-sm font-bold text-slate-500"><ArrowLeft size={16} /> กลับไปสแกนใบเสร็จ</button>
        <h1 className="flex items-center gap-2 text-lg font-bold"><HandCoins size={22} className="text-amber-600" /> ขอยืมเงินล่วงหน้า</h1>
        <AdvanceForm d={d} />
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-slate-200 bg-white/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
          <div className="mr-auto"><p className="text-xs text-slate-500">ยอดขอยืม</p><p className="text-lg font-bold tabular-nums">{baht(d.total)}</p></div>
          <button disabled={!d.valid || d.sending} onClick={() => d.send()} className="flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white disabled:opacity-40"><Send size={18} /> {d.sending ? "กำลังส่ง…" : "ส่งคำขอ"}</button>
        </div>
      </div>
    );
  }

  // รายการที่สแกนแล้ว
  return (
    <div className="space-y-4">
      {pick.inputs}
      <div className="flex items-center justify-between gap-2">
        <TypePicker d={d} />
        <span className="text-xs text-slate-500">ตรวจ OCR {d.verifiedCount}/{d.rows.length}</span>
      </div>
      <Field label="หัวข้อการเบิก"><Input value={d.title} onChange={(e) => d.setTitle(e.target.value)} placeholder={d.suggestedTitle} /></Field>

      <ul className="space-y-2.5">
        {d.rows.map((r, i) => {
          const Icon = catIcon(r.category);
          return (
            <li key={i} className="space-y-2.5 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200/70">
              <div className="flex items-center gap-2">
                <Icon size={18} className="shrink-0 text-slate-400" />
                <select value={r.category} onChange={(e) => d.setRow(i, { category: e.target.value })} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none">
                  {EXPENSE_CATS.map((c) => <option key={c.id}>{c.name}</option>)}
                </select>
                {r.verified && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600"><ScanText size={13} /> OCR</span>}
                <button aria-label="ลบรายการ" onClick={() => d.removeRow(i)} className="rounded-lg p-1.5 text-slate-400 active:bg-rose-50 active:text-rose-600"><Trash2 size={16} /></button>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input value={r.description} onChange={(e) => d.setRow(i, { description: e.target.value })} placeholder="รายละเอียด" className="py-2.5 text-sm" />
                <Input inputMode="decimal" value={r.amount} onChange={(e) => d.setRow(i, { amount: e.target.value })} placeholder="0.00" className="w-28 py-2.5 text-right font-bold tabular-nums" />
              </div>
              <div className="flex items-center gap-2">
                <Input type="date" value={r.date} onChange={(e) => d.setRow(i, { date: e.target.value })} className="py-2 text-sm" />
                <button onClick={() => pick.open("camera", r.category, i)}
                  className={`flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-dashed px-3 text-xs font-bold ${r.files ? "border-emerald-300 text-emerald-700" : "border-rose-300 text-rose-600"}`}>
                  <Camera size={15} /> {r.files ? `${r.files} ไฟล์` : "ถ่ายใบเสร็จ"}
                </button>
              </div>
              {mismatch(r) && <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700"><AlertTriangle size={13} /> ยอดไม่ตรงกับใบเสร็จ ({baht(r.ocrTotal!)})</p>}
            </li>
          );
        })}
      </ul>

      <button onClick={() => pick.open("camera")} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 font-bold text-blue-600 active:bg-blue-50">
        <ScanLine size={18} /> สแกนใบเสร็จเพิ่ม
      </button>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {QUICK.map((q) => (
          <button key={q.label} onClick={() => (q.manual ? d.addManual(q.cat) : pick.open("camera", q.cat))}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
            <q.icon size={14} className="text-blue-600" /> {q.label}
          </button>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
        {d.missingReceipt > 0 && <p className="mb-1.5 px-1 text-xs font-bold text-rose-600">ยังไม่ได้แนบใบเสร็จ {d.missingReceipt} รายการ</p>}
        {d.error && <div className="mb-1.5 px-1"><SendError d={d} /></div>}
        <div className="flex items-center gap-3">
          <div className="mr-auto"><p className="text-xs text-slate-500">ยอดรวม {d.rows.length} รายการ</p><p className="text-lg font-bold tabular-nums">{baht(d.total)}</p></div>
          <button disabled={!d.valid || d.sending} onClick={() => d.send()} className="flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white shadow-lg shadow-blue-600/25 disabled:opacity-40 disabled:shadow-none">
            <Send size={18} /> {d.sending ? "กำลังส่ง…" : "ส่งใบเบิก"}
          </button>
        </div>
      </div>
      {scanDialog}
    </div>
  );
}

/* ───────────────────────── คอม ───────────────────────── */
/** รับไฟล์ที่ลากมาวาง (รูป / PDF) */
const dropped = (e: React.DragEvent) => Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/") || f.type === "application/pdf");

/** แถบล่างติดขอบจอ: ยอดรวม · สิ่งที่ยังขาด · ปุ่มส่ง */
function ActionBar({ d }: { d: Draft }) {
  const advance = d.mode === "advance";
  const mismatchCount = d.rows.filter(mismatch).length;
  const issues = advance
    ? []
    : [
        d.missingReceipt > 0 && { tone: "text-rose-600", text: `ขาดใบเสร็จ ${d.missingReceipt} รายการ` },
        d.rows.some((r) => !r.description || !(parseFloat(r.amount) > 0)) && { tone: "text-rose-600", text: "กรอกรายละเอียด/ยอดเงินให้ครบ" },
        mismatchCount > 0 && { tone: "text-amber-600", text: `ยอดไม่ตรงใบเสร็จ ${mismatchCount} รายการ` },
        d.overLimit > 0 && { tone: "text-amber-600", text: `เกินวงเงิน ${d.overLimit} รายการ` },
      ].filter(Boolean) as { tone: string; text: string }[];

  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-slate-200 bg-white/95 px-6 py-4 shadow-lg shadow-slate-900/5 backdrop-blur">
      <div>
        <p className="text-xs text-slate-500">{advance ? "ยอดขอยืม" : `ยอดรวม ${d.rows.length} รายการ`}</p>
        <p className="text-2xl font-bold tabular-nums text-slate-900">{baht(d.total)}</p>
      </div>
      <div className="mr-auto min-w-0 text-sm">
        {d.error ? <SendError d={d} /> : issues.length ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {issues.map((x) => <li key={x.text} className={`flex items-center gap-1 font-bold ${x.tone}`}><AlertTriangle size={14} /> {x.text}</li>)}
          </ul>
        ) : d.valid ? (
          <p className="flex items-center gap-1.5 font-bold text-emerald-600"><CheckCircle2 size={16} /> พร้อมส่ง — ส่งถึง {CURRENT_ADMIN.name}</p>
        ) : (
          <p className="text-slate-500">{advance ? "กรอกวัตถุประสงค์และจำนวนเงิน" : "ใส่หัวข้อการเบิก"}</p>
        )}
      </div>
      {!advance && (
        <button disabled={d.sending} onClick={() => d.send(true)} className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><Save size={17} /> บันทึกร่าง</button>
      )}
      <button disabled={!d.valid || d.sending} onClick={() => d.send()} className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-40 disabled:shadow-none">
        <Send size={17} /> {d.sending ? "กำลังส่ง…" : advance ? "ส่งคำขอยืมเงิน" : "ส่งใบเบิก"}
      </button>
    </div>
  );
}

/** ขั้นตอน 1-2-3 (คอม) */
function Steps({ current, labels }: { current: number; labels: string[] }) {
  return (
    <ol className="mr-2 hidden items-center gap-2 text-sm xl:flex">
      {labels.map((l, i) => (
        <li key={l} className="flex items-center gap-2">
          {i > 0 && <span className={`h-0.5 w-6 rounded ${i <= current ? "bg-blue-600" : "bg-slate-200"}`} />}
          <span className={`grid size-6 place-items-center rounded-full text-xs font-bold ${i < current ? "bg-blue-600 text-white" : i === current ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-slate-100 text-slate-400"}`}>
            {i < current ? <Check size={13} /> : i + 1}
          </span>
          <span className={`whitespace-nowrap font-bold ${i <= current ? "text-slate-800" : "text-slate-400"}`}>{l}</span>
        </li>
      ))}
    </ol>
  );
}

function DesktopCreate() {
  const d = useDraft();
  const pick = usePicker(d);
  const [drag, setDrag] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  if (d.saved) return <Done e={d.saved} />;
  const advance = d.mode === "advance";
  /** ช่องที่ยังต้องกรอก → กรอบเหลือง */
  const need = "!border-amber-300 !bg-amber-50/60";
  const cell = "h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDrag(true); },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setDrag(false); d.enqueue(dropped(e)); },
  };

  const start = !advance && d.rows.length === 0;
  const reset = () => { d.setMode("expense"); d.clearRows(); };
  const choices = [
    {
      key: "receipt", icon: Upload, title: "มีใบเสร็จ", desc: "อัปโหลดรูปหรือ PDF ระบบอ่านยอดเงิน วันที่ และหมวดให้เอง", cta: "เลือกไฟล์ใบเสร็จ",
      onClick: () => pick.open("file"),
      cls: "bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700", iconCls: "bg-white/15 text-white", descCls: "text-white/80", ctaCls: "bg-white text-blue-700",
    },
    {
      key: "manual", icon: Keyboard, title: "ไม่มีใบเสร็จ", desc: "กรอกรายการเอง เช่น เบี้ยเลี้ยง ค่ารถรับจ้างที่ไม่มีบิล", cta: "กรอกเอง",
      // หมวดเริ่มต้น = เบี้ยเลี้ยง (หมวดที่ไม่บังคับใบเสร็จ) เปลี่ยนได้ในตาราง
      onClick: () => d.addManual("ค่าเบี้ยเลี้ยง"),
      cls: "border-2 border-slate-200 bg-white text-slate-900 hover:border-slate-400", iconCls: "bg-slate-100 text-slate-700", descCls: "text-slate-500", ctaCls: "bg-slate-900 text-white",
    },
    {
      key: "advance", icon: HandCoins, title: "ขอยืมเงินล่วงหน้า", desc: "ต้องการเงินก่อนไปใช้จริง แล้วค่อยส่งใบเสร็จเคลียร์ทีหลัง", cta: "ขอยืมเงิน",
      onClick: () => d.setMode("advance"),
      cls: "border-2 border-amber-200 bg-amber-50 text-slate-900 hover:border-amber-400", iconCls: "bg-amber-100 text-amber-700", descCls: "text-slate-600", ctaCls: "bg-amber-500 text-white",
    },
  ];

  return (
    /* ลากไฟล์มาวางได้ทั้งหน้า (ยกเว้นตอนขอยืมเงิน) */
    <div className="relative space-y-5" {...(advance ? {} : dropHandlers)}>
      {pick.inputs}
      {drag && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center rounded-2xl border-4 border-dashed border-blue-500 bg-blue-50/90">
          <p className="flex items-center gap-3 text-2xl font-bold text-blue-700"><Upload size={32} /> ปล่อยไฟล์เพื่ออ่านใบเสร็จ</p>
        </div>
      )}
      <PageHeader title={advance ? "ขอยืมเงินล่วงหน้า" : "สร้างใบเบิกค่าใช้จ่าย"}
        subtitle={advance ? "กรอกจำนวนเงินและวัตถุประสงค์ แล้วกดส่ง" : start ? "เลือก 1 อย่างด้านล่างเพื่อเริ่ม" : "ตรวจรายการให้ครบ แล้วกดส่งใบเบิก"}
        actions={
          <>
            <Steps current={start ? 0 : d.valid ? 2 : 1} labels={advance ? ["เลือกวิธี", "กรอกคำขอ", "ส่งคำขอ"] : ["เลือกวิธี", "กรอก / ตรวจรายการ", "ส่งใบเบิก"]} />
            {!start && (
              <button onClick={reset} className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50">
                <ArrowLeft size={16} /> เริ่มใหม่
              </button>
            )}
          </>
        } />

      {advance ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <AdvanceForm d={d} />
          </section>
          <ActionBar d={d} />
        </>
      ) : start ? (
        /* ── หน้าเริ่ม: ถามคำถามเดียว ตอบด้วยปุ่มใหญ่ 3 ปุ่ม ── */
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-sm">
          <h2 className="text-center text-2xl font-bold text-slate-900">วันนี้จะเบิกแบบไหน?</h2>
          <div className="mx-auto mt-8 grid max-w-5xl gap-4 lg:grid-cols-3">
            {choices.map((c) => (
              <button key={c.key} onClick={c.onClick}
                className={`group flex min-h-[240px] flex-col items-start rounded-2xl p-6 text-left transition hover:-translate-y-0.5 active:translate-y-0 ${c.cls}`}>
                <span className={`grid size-14 place-items-center rounded-2xl ${c.iconCls}`}><c.icon size={28} /></span>
                <span className="mt-4 text-xl font-bold">{c.title}</span>
                <span className={`mt-1 text-sm leading-relaxed ${c.descCls}`}>{c.desc}</span>
                <span className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition group-hover:brightness-95 ${c.ctaCls}`}>
                  {c.cta} <ArrowRight size={18} />
                </span>
              </button>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">หรือลากไฟล์ใบเสร็จมาวางที่ไหนก็ได้ในหน้านี้ · เลือกได้หลายใบพร้อมกัน</p>
        </section>
      ) : (
        /* ── มีรายการแล้ว: การ์ดเดียว (หัวข้อ + ตาราง) + แถบส่งด้านล่าง ── */
        <>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* หัวข้อ + ประเภท: ระบบตั้งให้อัตโนมัติ กดแก้ได้ */}
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3.5">
              <span className="shrink-0 text-sm text-slate-500">หัวข้อ</span>
              {editTitle ? (
                <form className="flex min-w-[280px] flex-1 items-center gap-2" onSubmit={(e) => { e.preventDefault(); setEditTitle(false); }}>
                  <Input autoFocus value={d.title} onChange={(e) => d.setTitle(e.target.value)} placeholder={d.suggestedTitle} className="py-2" />
                  <button className="h-10 shrink-0 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white">เสร็จ</button>
                </form>
              ) : (
                <>
                  <span className="min-w-0 truncate font-bold text-slate-900">{d.finalTitle || "—"}</span>
                  <button onClick={() => setEditTitle(true)} className="flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50">
                    <PenLine size={14} /> แก้ไข
                  </button>
                </>
              )}
              <span className="ml-auto"><TypePicker d={d} /></span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className={`${thCls} w-10 text-center`}>#</th>
                    <th className={`${thCls} w-40 !px-2`}>วันที่</th>
                    <th className={`${thCls} !px-2`}>รายละเอียด</th>
                    <th className={`${thCls} w-52 !px-2`}>หมวด</th>
                    <th className={`${thCls} w-32 !px-2 text-right`}>จำนวนเงิน</th>
                    <th className={`${thCls} w-32 !px-2`}>ใบเสร็จ</th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {d.rows.map((r, i) => {
                    const c = cat(r.category);
                    const over = !!c?.limit && parseFloat(r.amount) > c.limit;
                    return (
                      <tr key={i} className="align-top hover:bg-slate-50/60">
                        <td className="px-2 py-2.5"><span className="grid h-10 place-items-center font-bold text-slate-400">{i + 1}</span></td>
                        <td className="px-2 py-2.5"><input type="date" className={cell} value={r.date} onChange={(e) => d.setRow(i, { date: e.target.value })} /></td>
                        <td className="px-2 py-2.5">
                          <input className={`${cell} ${r.description ? "" : need}`} value={r.description} onChange={(e) => d.setRow(i, { description: e.target.value })}
                            autoFocus={!r.verified && i === d.rows.length - 1 && !r.description} placeholder="เช่น ค่าน้ำมันไปพบลูกค้า" />
                        </td>
                        <td className="px-2 py-2.5">
                          <select className={cell} value={r.category} onChange={(e) => d.setRow(i, { category: e.target.value })}>
                            {EXPENSE_CATS.map((x) => <option key={x.id}>{x.name}</option>)}
                          </select>
                          {over && <p className="mt-1 text-xs font-bold text-amber-600">เกินวงเงิน {baht(c!.limit!)}/{c!.limitUnit}</p>}
                        </td>
                        <td className="px-2 py-2.5">
                          <input inputMode="decimal" className={`${cell} text-right text-[15px] font-bold tabular-nums ${parseFloat(r.amount) > 0 ? "" : need}`} value={r.amount} onChange={(e) => d.setRow(i, { amount: e.target.value })} placeholder="0.00" />
                          {mismatch(r) && <p className="mt-1 text-right text-xs font-bold text-amber-600">ใบเสร็จ {baht(r.ocrTotal!)}</p>}
                        </td>
                        <td className="px-2 py-2.5">
                          <button onClick={() => pick.open("file", r.category, i)}
                            className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-bold transition hover:brightness-95 ${
                              mismatch(r) ? "border-amber-300 bg-amber-50 text-amber-700" : r.verified || r.files ? "border-emerald-300 bg-emerald-50 text-emerald-700" : c?.receiptRequired ? "border-dashed border-rose-300 bg-rose-50/50 text-rose-600" : "border-dashed border-slate-300 text-slate-500"}`}>
                            {mismatch(r) ? <><AlertTriangle size={14} /> ยอดไม่ตรง</> : r.verified || r.files ? <><CheckCircle2 size={14} /> {r.files} ไฟล์</> : <><Paperclip size={14} /> แนบไฟล์</>}
                          </button>
                        </td>
                        <td className="px-2 py-2.5"><button aria-label={`ลบแถว ${i + 1}`} onClick={() => d.removeRow(i)} className="grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* เพิ่มรายการ */}
            <div className="flex items-center gap-3 border-t border-slate-100 p-4">
              <button onClick={() => pick.open("file")}
                className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm font-bold transition ${drag ? "border-blue-500 bg-blue-50 text-blue-700" : "border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50/50"}`}>
                <Upload size={16} /> เพิ่มใบเสร็จ — ลากมาวางหรือคลิกเลือกไฟล์
              </button>
              <button onClick={() => d.addManual()} className="flex h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"><Plus size={16} /> กรอกเอง</button>
            </div>
          </section>
          <ActionBar d={d} />
        </>
      )}

      <Dialog variant="modal" wide open={!!d.current} onClose={d.skipScan}
        title={d.queue && d.queue.files.length > 1 ? `ตรวจใบเสร็จ — เหลืออีก ${d.queue.files.length} ใบ` : "ตรวจใบเสร็จ — เทียบค่ากับกรอบบนรูป"}>
        {d.current && <ReceiptScanner key={d.current.name + d.current.lastModified + d.queue!.files.length} file={d.current} layout="split" presetCategory={d.queue!.preset} onConfirm={d.applyScan} onRetake={d.skipScan} />}
      </Dialog>
    </div>
  );
}

export default function NewExpense() {
  return (
    <>
      <MobileView><MobileCreate /></MobileView>
      <DesktopView><DesktopCreate /></DesktopView>
    </>
  );
}
