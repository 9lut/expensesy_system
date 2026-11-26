"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleX, Eye, EyeOff, FileText, Info, Loader2, RotateCcw, ScanText, ShieldCheck } from "lucide-react";
import {
  DOC_TYPE_LABEL, FIELD_META, LOW_CONFIDENCE, checkReceipt, detectDocType, extractFields, parseAmount,
  type Check, type DocType, type Field, type FieldKey, type OcrResult,
} from "@/lib/ocr";
import { SAMPLE_OCR, SAMPLE_RECEIPT_SRC } from "@/lib/ocr-sample";
import { CATEGORIES, TODAY } from "@/lib/mock";
import { suggestCategory } from "@/lib/ocr";
import { ReceiptOverlay } from "./ReceiptOverlay";

export interface ScanResult {
  amount?: number;
  subtotal?: number;
  vat?: number;
  date?: string;
  vendor?: string;
  taxId?: string;
  receiptNo?: string;
  docType: DocType;
  /** ชื่อหมวด (ระบบเดา / เมนูด่วน / ผู้ใช้เลือก) */
  category: string;
  /** ยอดที่ OCR อ่านได้ (ไว้เทียบกับยอดที่เบิก) */
  ocrTotal?: number;
  /** จำนวนข้อที่ตรวจไม่ผ่าน (fail) ณ ตอนยืนยัน */
  failedChecks: number;
}

const ORDER: FieldKey[] = ["total", "subtotal", "vat", "date", "vendor", "taxId", "receiptNo"];
const MONEY: FieldKey[] = ["total", "subtotal", "vat"];

/** หมุนรูปตาม EXIF + ย่อไม่เกิน 1600px → JPEG · PDF → เรนเดอร์ 3 หน้าแรกเป็นรูปเดียว */
async function normalize(file: File): Promise<{ blob: Blob; pdf?: { pages: number; total: number } }> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const { pdfToImage } = await import("@/lib/pdf");
    const r = await pdfToImage(file, 3);
    return { blob: r.blob, pdf: { pages: r.pages, total: r.total } };
  }
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("แปลงรูปไม่สำเร็จ"))), "image/jpeg", 0.9));
  return { blob };
}

type State =
  | { phase: "reading"; step: string }
  | { phase: "error"; message: string }
  | { phase: "check"; src: string; result: OcrResult; fields: Field[]; docType: DocType; sample: boolean; pdf?: { pages: number; total: number } };

const CHECK_STYLE: Record<Check["status"], { icon: typeof CheckCircle2; cls: string }> = {
  ok: { icon: CheckCircle2, cls: "text-emerald-600" },
  warn: { icon: AlertTriangle, cls: "text-amber-600" },
  fail: { icon: CircleX, cls: "text-rose-600" },
  info: { icon: Info, cls: "text-slate-400" },
};

/**
 * อ่านเอกสาร (รูป / PDF) ด้วย OCR แล้วให้ผู้ใช้ตรวจกรอบ ค่า และผลตรวจแบบบัญชีก่อนนำไปใช้
 * ใส่ key={ไฟล์} จากภายนอก เพื่อเริ่มใหม่ทุกครั้งที่เลือกไฟล์ใหม่
 * layout: stack = มือถือ (รูปบน ฟิลด์ล่าง) · split = คอม (รูปซ้าย ฟิลด์ขวา)
 */
export function ReceiptScanner({ file, layout, onConfirm, onRetake, presetCategory }: {
  file: File; layout: "stack" | "split"; onConfirm: (r: ScanResult) => void; onRetake: () => void;
  /** หมวดที่ผู้ใช้เลือกจากเมนูด่วน (ไม่ใส่ = ให้ระบบเดาจากข้อความในใบเสร็จ) */
  presetCategory?: string;
}) {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const [state, setState] = useState<State>({ phase: "reading", step: isPdf ? "กำลังแปลง PDF เป็นภาพ…" : "กำลังอ่านใบเสร็จ…" });
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({});
  const [category, setCategory] = useState<string>(presetCategory ?? "");
  const [autoCat, setAutoCat] = useState(false);
  const [active, setActive] = useState<string | null>("total");
  const [showAll, setShowAll] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let url = "";
    let cancelled = false;
    (async () => {
      try {
        const { blob, pdf } = await normalize(file);
        if (pdf && !cancelled) setState({ phase: "reading", step: `กำลังอ่าน PDF ${pdf.pages} หน้า…` });
        const body = new FormData();
        body.append("file", blob, "document.jpg");
        const res = await fetch("/api/ocr", { method: "POST", body });
        let result: OcrResult;
        let sample = false;
        if (res.status === 501) {
          result = SAMPLE_OCR; // ยังไม่ได้ตั้งค่า OCR → ใช้ใบเสร็จตัวอย่าง
          sample = true;
        } else if (!res.ok) {
          throw new Error((await res.json().catch(() => ({}))).error ?? "อ่านเอกสารไม่สำเร็จ");
        } else {
          result = await res.json();
        }
        if (cancelled) return;
        url = sample ? SAMPLE_RECEIPT_SRC : URL.createObjectURL(blob);
        const fields = extractFields(result);
        setValues(Object.fromEntries(fields.map((f) => [f.key, MONEY.includes(f.key) ? f.value.replace(/,/g, "") : f.value])));
        if (!presetCategory) {
          // ไม่ได้เลือกหมวดมาก่อน → เดาจากข้อความ (ไม่ตรงกฎไหน = "อื่น ๆ")
          setCategory(suggestCategory(result.text) ?? CATEGORIES[CATEGORIES.length - 1].name);
          setAutoCat(true);
        }
        setState({ phase: "check", src: url, result, fields, docType: detectDocType(result.text), sample, pdf });
      } catch (e) {
        if (!cancelled) setState({ phase: "error", message: e instanceof Error ? e.message : "อ่านเอกสารไม่สำเร็จ" });
      }
    })();
    return () => { cancelled = true; if (url.startsWith("blob:")) URL.revokeObjectURL(url); };
  }, [file, presetCategory]);

  if (state.phase === "reading") {
    return (
      <div className="grid place-items-center gap-3 py-16 text-center text-slate-500">
        <span className="relative grid size-16 place-items-center text-blue-600">
          {isPdf ? <FileText size={30} /> : <ScanText size={30} />}<Loader2 size={64} className="absolute animate-spin text-blue-200" />
        </span>
        <p className="font-bold text-slate-700">{state.step}</p>
        <p className="text-sm">ระบบหายอดเงิน VAT วันที่ และผู้ขายให้อัตโนมัติ</p>
      </div>
    );
  }
  if (state.phase === "error") {
    return (
      <div className="space-y-4 py-8 text-center">
        <AlertTriangle size={40} className="mx-auto text-amber-500" />
        <p className="font-bold">{state.message}</p>
        <p className="text-sm text-slate-500">ลองถ่ายใหม่ให้เห็นทั้งใบ แสงสว่าง ไม่เอียง หรือใช้ไฟล์ PDF ต้นฉบับ</p>
        <button onClick={onRetake} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-5 font-bold"><RotateCcw size={16} /> เลือกไฟล์ใหม่</button>
      </div>
    );
  }

  const { src, result, fields, docType, sample, pdf } = state;
  const byKey = new Map(fields.map((f) => [f.key, f]));
  const lowCount = fields.filter((f) => f.confidence < LOW_CONFIDENCE).length;
  const checks = checkReceipt(values, docType, TODAY);
  const failed = checks.filter((c) => c.status === "fail").length;
  const warned = checks.filter((c) => c.status === "warn").length;
  const total = Number(values.total);
  const canUse = checked && total > 0;
  const num = (k: FieldKey) => (values[k] ? Number(values[k]) : undefined);

  const confirm = () => onConfirm({
    amount: total, subtotal: num("subtotal"), vat: num("vat"),
    date: values.date, vendor: values.vendor, taxId: values.taxId, receiptNo: values.receiptNo,
    docType, failedChecks: failed, category,
    ocrTotal: byKey.get("total") ? parseAmount(byKey.get("total")!.value) : undefined,
  });

  const image = (
    <div className="space-y-2">
      <ReceiptOverlay src={src} result={result} fields={fields} active={active} showAll={showAll} onPick={setActive} />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {pdf && <b className="text-slate-700">PDF {pdf.pages}{pdf.total > pdf.pages ? `/${pdf.total}` : ""} หน้า · </b>}
          อ่านได้ {result.lines.length} บรรทัด{result.ms ? ` · ${(result.ms / 1000).toFixed(1)} วินาที` : ""}
        </span>
        <button onClick={() => setShowAll(!showAll)} className="inline-flex items-center gap-1 font-bold text-slate-600">
          {showAll ? <EyeOff size={14} /> : <Eye size={14} />} {showAll ? "ซ่อนกรอบอื่น" : "แสดงทุกกรอบ"}
        </button>
      </div>
      {pdf && pdf.total > pdf.pages && <p className="text-xs text-amber-700">อ่านเฉพาะ {pdf.pages} หน้าแรกจาก {pdf.total} หน้า</p>}
    </div>
  );

  const panel = (
    <div className="space-y-4">
      {sample && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">ยังไม่ได้เชื่อม OCR บนเครื่องนี้ — แสดงผลจากใบเสร็จตัวอย่าง</p>
      )}

      {/* หัว: ประเภทเอกสาร + สรุปผลตรวจ */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white"><FileText size={13} /> {DOC_TYPE_LABEL[docType]}</span>
        {failed > 0 ? <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200">ไม่ผ่าน {failed} ข้อ</span>
          : warned > 0 ? <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">ควรตรวจ {warned} ข้อ</span>
          : <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">ผ่านการตรวจทุกข้อ</span>}
        {lowCount > 0 && <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">OCR ไม่แน่ใจ {lowCount} ช่อง</span>}
      </div>

      {/* หมวดค่าใช้จ่าย: ระบบเดาให้ หรือมาจากเมนูด่วน */}
      <label className="block rounded-xl bg-blue-50/60 p-3 ring-1 ring-blue-200">
        <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-700">
          หมวดค่าใช้จ่าย
          {autoCat && <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">ระบบจัดให้</span>}
        </span>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setAutoCat(false); }}
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100">
          {CATEGORIES.filter((c) => c.active && c.appliesTo.some((t) => t !== "advance")).map((c) => (
            <option key={c.id} value={c.name}>{c.name} · {c.appliesTo.includes("travel") ? "ค่าเดินทาง" : "ทั่วไป"}</option>
          ))}
        </select>
      </label>

      {/* ฟิลด์ (สีตรงกับกรอบบนรูป) */}
      <ul className="grid gap-2 sm:grid-cols-2">
        {ORDER.map((k) => {
          const f = byKey.get(k);
          const meta = FIELD_META[k];
          const low = f && f.confidence < LOW_CONFIDENCE;
          const on = active === k;
          const wide = k === "total" || k === "vendor";
          return (
            <li key={k} onClick={() => setActive(k)}
              className={`rounded-xl p-3 ring-1 transition ${wide ? "sm:col-span-2" : ""} ${on ? "bg-white shadow-md ring-2" : "bg-slate-50 ring-slate-200"}`}
              style={on ? { ["--tw-ring-color" as string]: meta.color } : undefined}>
              <div className="mb-1.5 flex items-center gap-2 text-xs">
                <span className="grid size-5 shrink-0 place-items-center rounded text-[11px] font-bold text-white" style={{ background: meta.color }}>{Object.keys(FIELD_META).indexOf(k) + 1}</span>
                <span className="truncate font-bold text-slate-700">{meta.label}</span>
                <span className="ml-auto shrink-0">
                  {!f ? <span className="font-bold text-slate-400">ไม่พบ</span>
                    : low ? <span className="font-bold text-amber-600">⚠ {Math.round(f.confidence * 100)}%</span>
                    : <span className="font-bold text-emerald-600">✓ {Math.round(f.confidence * 100)}%</span>}
                </span>
              </div>
              <input
                type={k === "date" ? "date" : "text"}
                inputMode={MONEY.includes(k) ? "decimal" : undefined}
                value={values[k] ?? ""}
                onFocus={() => setActive(k)}
                onChange={(e) => setValues({ ...values, [k]: e.target.value })}
                placeholder={f ? undefined : "กรอกเอง"}
                className={`h-11 w-full rounded-lg border bg-white px-3 outline-none focus:ring-4 focus:ring-blue-100 ${MONEY.includes(k) ? "text-right tabular-nums" : ""} ${k === "total" ? "text-lg font-bold" : "text-sm"} ${low ? "border-amber-300" : "border-slate-200"}`}
              />
            </li>
          );
        })}
      </ul>

      {/* ตรวจความถูกต้องทางบัญชี */}
      <section className="rounded-xl ring-1 ring-slate-200">
        <h4 className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5 text-sm font-bold"><ShieldCheck size={16} className="text-blue-600" /> ตรวจความถูกต้องทางบัญชี</h4>
        <ul className="divide-y divide-slate-100">
          {checks.map((c) => {
            const S = CHECK_STYLE[c.status];
            return (
              <li key={c.id} className="flex items-start gap-2.5 px-3 py-2 text-sm">
                <S.icon size={17} className={`mt-0.5 shrink-0 ${S.cls}`} />
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-800">{c.label}</span>
                  <span className={`block text-xs ${c.status === "fail" ? "text-rose-600" : c.status === "warn" ? "text-amber-700" : "text-slate-500"}`}>{c.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <label className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 ${checked ? "bg-emerald-50 ring-emerald-300" : "bg-white ring-slate-300"}`}>
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 size-5 accent-emerald-600" />
        <span className="text-sm"><b>ฉันตรวจแล้ว</b> ข้อมูลตรงกับเอกสาร และเป็นค่าใช้จ่ายในงานจริง{failed > 0 && <span className="block text-rose-600">มี {failed} ข้อที่ไม่ผ่าน — แอดมินจะเห็นคำเตือนนี้</span>}</span>
      </label>

      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button onClick={onRetake} className="flex h-12 items-center gap-1.5 rounded-xl border border-slate-200 px-4 font-bold text-slate-600"><RotateCcw size={16} /> เลือกใหม่</button>
        <button disabled={!canUse} onClick={confirm} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/25 disabled:opacity-40 disabled:shadow-none">
          <CheckCircle2 size={18} /> ใช้ข้อมูลนี้
        </button>
      </div>
    </div>
  );

  return layout === "split"
    ? <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div className="md:sticky md:top-0">{image}</div>{panel}</div>
    : <div className="space-y-4">{image}{panel}</div>;
}
