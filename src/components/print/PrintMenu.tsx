import Link from "next/link";
import { ChevronDown, FileText, Printer } from "lucide-react";
import type { Expense } from "@/lib/types";
import { DOCS, DOC_KEYS } from "./registry";

/** ปุ่ม "พิมพ์เอกสาร" + รายการแบบฟอร์มที่ใช้กับใบเบิกนี้ได้ (ใช้ <details> ไม่ต้องมี JS) */
export function PrintMenu({ e }: { e: Expense }) {
  const docs = DOC_KEYS.filter((k) => DOCS[k].accepts(e));
  return (
    <details className="group relative">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
        <Printer size={16} /> พิมพ์เอกสาร <ChevronDown size={15} className="transition group-open:rotate-180" />
      </summary>
      <ul className="absolute right-0 z-30 mt-1.5 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
        {docs.map((k) => (
          <li key={k}>
            <Link href={`/print/${k}?id=${encodeURIComponent(e.id)}`} target="_blank"
              className="flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-slate-50">
              <FileText size={16} className="mt-0.5 shrink-0 text-blue-600" />
              <span>
                <span className="block text-sm font-bold text-slate-800">{DOCS[k].title}</span>
                <span className="line-clamp-1 text-xs text-slate-500">{DOCS[k].desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
