import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { EXPENSES } from "@/lib/mock";
import { DOCS, DOC_KEYS } from "@/components/print/registry";

/** /print — รวมแบบฟอร์มเอกสาร พร้อมภาพตัวอย่างย่อ */
export default function PrintIndex() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-8">
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800"><ArrowLeft size={16} /> กลับหน้าหลัก</Link>
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">แบบฟอร์มเอกสาร</h1>
        <p className="mt-1 text-sm text-slate-500">เอกสารทางการขนาด A4 สร้างจากข้อมูลใบเบิกอัตโนมัติ · เปิดแล้วกด “พิมพ์ / บันทึก PDF”</p>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DOC_KEYS.map((k) => {
          const d = DOCS[k];
          const e = EXPENSES.find((x) => x.id === d.sample) ?? EXPENSES.find(d.accepts)!;
          return (
            <li key={k}>
              <Link href={`/print/${k}`} className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg">
                {/* ภาพย่อ: เรนเดอร์เอกสารจริงแล้วย่อ 30% */}
                <div className="relative h-[240px] overflow-hidden border-b border-slate-100 bg-slate-100">
                  <div aria-hidden className="pointer-events-none absolute left-1/2 top-4 origin-top -translate-x-1/2 scale-[0.3] [&_.sheet:not(:first-child)]:hidden">
                    {d.render(e)}
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-bold text-slate-900 group-hover:text-blue-700">{d.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{d.desc}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600"><Printer size={15} /> เปิดเอกสาร</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
