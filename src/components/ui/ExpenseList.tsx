"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronRight, Paperclip } from "lucide-react";
import { TYPE_META, baht, thDate } from "@/lib/meta";
import type { Expense } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { DataTable, type Column } from "./DataTable";
import { EmptyState } from "./EmptyState";

export { EmptyState };

const receipts = (e: Expense) => e.items.reduce((a, i) => a + i.receipts, 0);

/**
 * คอม: ตาราง (เรียงลำดับได้ทุกคอลัมน์หลัก) — คลิกที่ไหนก็ได้ในแถวเพื่อเปิดรายละเอียด
 * hrefBase: "/expenses" (พนักงาน) หรือ "/admin/expenses" (แอดมิน — อยู่ใน Sidebar แอดมินต่อ)
 */
export function ExpenseTable({ items, showEmployee = false, hrefBase = "/expenses" }: { items: Expense[]; showEmployee?: boolean; hrefBase?: string }) {
  const router = useRouter();
  const columns: Column<Expense>[] = [
    {
      key: "title", header: "เลขที่ / หัวข้อ", sort: (e) => e.title,
      cell: (e) => (
        <>
          <span className="font-bold">{e.title}</span>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {e.id}
            {e.items.some((i) => i.overLimit) && <span className="inline-flex items-center gap-0.5 font-bold text-amber-600"><AlertTriangle size={12} /> เกินวงเงิน</span>}
          </div>
        </>
      ),
    },
    ...(showEmployee ? [{
      key: "employee", header: "พนักงาน", sort: (e: Expense) => e.employee,
      cell: (e: Expense) => <>{e.employee}<div className="text-xs text-slate-400">{e.department}</div></>,
    }] : []),
    {
      key: "type", header: "ประเภท", sort: (e) => TYPE_META[e.type].label,
      cell: (e) => { const T = TYPE_META[e.type]; return <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><T.icon size={15} className="text-slate-400" />{T.label}</span>; },
    },
    { key: "date", header: "วันที่", sort: (e) => e.createdAt, cell: (e) => <span className="whitespace-nowrap text-slate-600">{thDate(e.createdAt)}</span> },
    { key: "receipts", header: "ใบเสร็จ", align: "center", sort: receipts, cell: (e) => <span className="inline-flex items-center gap-1 text-slate-500"><Paperclip size={13} />{receipts(e)}</span> },
    { key: "status", header: "สถานะ", sort: (e) => e.status, cell: (e) => <StatusBadge status={e.status} /> },
    { key: "total", header: "ยอดรวม", align: "right", sort: (e) => e.total, cell: (e) => <span className="text-[15px] font-bold tabular-nums">{baht(e.total)}</span> },
    {
      key: "go", header: "", className: "w-10",
      // ลิงก์จริงไว้สำหรับคีย์บอร์ด/เปิดแท็บใหม่ — คลิกเมาส์ใช้ทั้งแถว
      cell: (e) => <Link href={`${hrefBase}/${e.id}`} onClick={(ev) => ev.stopPropagation()} aria-label={`ดู ${e.id}`}><ChevronRight size={18} className="text-slate-400" /></Link>,
    },
  ];
  return (
    <DataTable rows={items} columns={columns} rowKey={(e) => e.id} minWidth={showEmployee ? 880 : 760}
      onRowClick={(e) => router.push(`${hrefBase}/${e.id}`)} />
  );
}

/** มือถือ: รายการแบบกะทัดรัด (กลุ่มเดียวกันอยู่ในกล่องเดียว คั่นด้วยเส้น) */
export function ExpenseCards({ items, showEmployee = false, hrefBase = "/expenses" }: { items: Expense[]; showEmployee?: boolean; hrefBase?: string }) {
  if (items.length === 0) return <EmptyState />;
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
      {items.map((e) => {
        const T = TYPE_META[e.type];
        return (
          <li key={e.id}>
            <Link href={`${hrefBase}/${e.id}`} className="flex items-center gap-3 px-3.5 py-3 active:bg-slate-50">
              <T.icon size={20} className="shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-bold">{e.title}</p>
                  <p className="shrink-0 text-sm font-bold tabular-nums">{baht(e.total)}</p>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-slate-500">{showEmployee ? `${e.employee} · ` : ""}{thDate(e.createdAt)}</p>
                  <StatusBadge status={e.status} />
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
