"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LayoutGrid, Printer } from "lucide-react";

interface Opt { value: string; label: string }

/** แถบเครื่องมือด้านบน (ไม่แสดงตอนพิมพ์) */
export function PrintToolbar({ doc, id, docs, options }: { doc: string; id: string; docs: Opt[]; options: Opt[] }) {
  const router = useRouter();
  const go = (d: string, i?: string) => router.push(`/print/${d}${i ? `?id=${encodeURIComponent(i)}` : ""}`);
  const sel = "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-4 py-3">
        <button onClick={() => router.back()} className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-slate-100">
          <ArrowLeft size={17} /> กลับ
        </button>
        <Link href="/print" className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-slate-100">
          <LayoutGrid size={17} /> แบบฟอร์มทั้งหมด
        </Link>
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <label className="flex items-center gap-2 text-sm text-slate-500">
          เอกสาร
          <select aria-label="เลือกเอกสาร" value={doc} onChange={(e) => go(e.target.value)} className={sel}>
            {docs.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </label>
        <label className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
          ใบเบิก
          <select aria-label="เลือกใบเบิก" value={id} onChange={(e) => go(doc, e.target.value)} className={`${sel} max-w-[320px]`}>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <button onClick={() => window.print()} className="ml-auto flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
          <Printer size={17} /> พิมพ์ / บันทึก PDF
        </button>
      </div>
    </div>
  );
}
