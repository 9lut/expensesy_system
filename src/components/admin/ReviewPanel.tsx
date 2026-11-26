"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Image as ImageIcon, ScanText } from "lucide-react";
import { TYPE_META, baht, thDate } from "@/lib/meta";
import type { Expense, ExpenseItem } from "@/lib/types";
import { extractFields } from "@/lib/ocr";
import { SAMPLE_OCR, SAMPLE_RECEIPT_SRC } from "@/lib/ocr-sample";
import { Timeline } from "@/components/ui/Timeline";
import { Dialog } from "@/components/ui/Dialog";
import { ReceiptOverlay } from "@/components/receipt/ReceiptOverlay";
import { JournalPreview } from "./JournalPreview";

/** ผลเทียบยอดที่เบิก กับยอดที่ OCR อ่านได้จากใบเสร็จ */
function ocrCheck(it: ExpenseItem): "match" | "mismatch" | "none" {
  if (it.ocrTotal === undefined) return "none";
  return Math.abs(it.ocrTotal - it.amount) < 0.01 ? "match" : "mismatch";
}

function OcrBadge({ it }: { it: ExpenseItem }) {
  const s = ocrCheck(it);
  if (s === "match") return <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 size={13} /> OCR ยอดตรงใบเสร็จ</span>;
  if (s === "mismatch") return <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600"><AlertTriangle size={13} /> ใบเสร็จ {baht(it.ocrTotal!)} ≠ เบิก {baht(it.amount)}</span>;
  return it.receipts ? <span className="text-xs text-slate-400">ยังไม่ได้ตรวจด้วย OCR</span> : null;
}

/** รายละเอียดใบเบิกสำหรับผู้ตรวจ (ใช้ทั้ง Bottom Sheet และแผงขวาบนคอม) */
export function ReviewPanel({ e }: { e: Expense }) {
  const T = TYPE_META[e.type];
  const [viewer, setViewer] = useState(false);
  const checks = e.items.map(ocrCheck);
  const mismatch = checks.filter((c) => c === "mismatch").length;
  const scanned = checks.filter((c) => c !== "none").length;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-slate-400">{e.id} · {thDate(e.createdAt)}</p>
        <h3 className="text-lg font-bold">{e.title}</h3>
        <p className="flex items-center gap-1.5 text-sm text-slate-500"><T.icon size={14} /> {T.label} · {e.employee} · {e.department}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-blue-600">{baht(e.total)}</p>
      </div>

      {scanned > 0 && (
        <p className={`flex items-center gap-2 rounded-xl p-3 text-sm font-bold ${mismatch ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
          <ScanText size={18} />
          {mismatch ? `OCR พบยอดไม่ตรงใบเสร็จ ${mismatch} รายการ — ควรตรวจก่อนอนุมัติ` : `OCR ยอดตรงใบเสร็จทั้ง ${scanned} รายการ`}
        </p>
      )}

      <ul className="divide-y divide-slate-100 rounded-2xl bg-slate-50 px-4">
        {e.items.map((it, i) => (
          <li key={i} className="space-y-2 py-3">
            <div className="flex justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-bold">{it.description}</p>
                <p className="text-xs text-slate-500">{thDate(it.date)} · {it.category}</p>
              </div>
              <span className="font-bold tabular-nums">{baht(it.amount)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <OcrBadge it={it} />
              {it.overLimit && <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600"><AlertTriangle size={12} /> เกินวงเงินของหมวด</span>}
            </div>
            <div className="flex gap-1.5">
              {it.receipts === 0
                ? <span className="text-xs font-bold text-rose-600">ไม่มีใบเสร็จ</span>
                : Array.from({ length: it.receipts }).map((_, j) => (
                  <button key={j} onClick={() => setViewer(true)} aria-label={`ดูใบเสร็จ ${j + 1} พร้อมกรอบ OCR`}
                    className="grid size-14 place-items-center rounded-xl bg-white text-slate-400 ring-1 ring-slate-200 hover:text-blue-600 hover:ring-blue-400">
                    <ImageIcon size={18} />
                  </button>
                ))}
            </div>
          </li>
        ))}
      </ul>

      <JournalPreview e={e} />

      <div>
        <h4 className="mb-3 text-sm font-bold text-slate-500">ประวัติ</h4>
        <Timeline history={e.history} />
      </div>

      {/* Phase 1: แสดงใบเสร็จตัวอย่าง + กรอบ OCR จริง (ไฟล์จริงจะมาจาก Drive ใน Phase 2) */}
      <Dialog variant="modal" wide open={viewer} onClose={() => setViewer(false)} title="ใบเสร็จ + กรอบ OCR (ตัวอย่าง)">
        <div className="mx-auto max-w-md">
          <ReceiptOverlay src={SAMPLE_RECEIPT_SRC} result={SAMPLE_OCR} fields={extractFields(SAMPLE_OCR)} showAll />
        </div>
      </Dialog>
    </div>
  );
}
