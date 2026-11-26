"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { EXPENSES } from "@/lib/mock";
import { STATUS_META, TYPE_META, baht } from "@/lib/meta";
import { PageHeader } from "@/components/ui/PageHeader";
import { ExpenseCards, ExpenseTable } from "@/components/ui/ExpenseList";
import { FilterBar, inDateRange, type FilterFacet } from "@/components/ui/FilterBar";
import { DesktopView, MobileView } from "@/components/ui/Responsive";

const opts = (m: Record<string, { label: string }>) => Object.entries(m).map(([value, v]) => ({ value, label: v.label }));

export default function AllExpenses() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string[]>([]);
  const [type, setType] = useState<string[]>([]);
  const [dept, setDept] = useState<string[]>([]);
  const [range, setRange] = useState<string[]>([]);

  const facets: FilterFacet[] = [
    { id: "date", label: "วันที่เบิก", type: "dateRange", selected: range, onChange: setRange },
    { id: "status", label: "สถานะ", options: opts(STATUS_META), selected: status, onChange: setStatus },
    { id: "type", label: "ประเภท", options: opts(TYPE_META), selected: type, onChange: setType },
    { id: "dept", label: "แผนก", options: [...new Set(EXPENSES.map((e) => e.department))].map((d) => ({ value: d, label: d })), selected: dept, onChange: setDept },
  ];

  const rows = [...EXPENSES]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((e) =>
      (!status.length || status.includes(e.status)) &&
      (!type.length || type.includes(e.type)) &&
      (!dept.length || dept.includes(e.department)) &&
      inDateRange(e.createdAt, range) &&
      (e.title + e.id + e.employee).toLowerCase().includes(q.toLowerCase()));
  const total = rows.reduce((a, e) => a + e.total, 0);

  const bar = (
    <FilterBar searchValue={q} onSearchChange={setQ} searchPlaceholder="ค้นหา ชื่อพนักงาน / เลขที่ / หัวข้อ"
      facets={facets} totalItems={rows.length} itemNoun="ใบเบิก"
      summary={<>รวม <b className="tabular-nums text-slate-900">{baht(total)}</b></>} />
  );

  return (
    <>
      <MobileView>
        <div className="space-y-4">
          {bar}
          <ExpenseCards items={rows} showEmployee hrefBase="/admin/expenses" />
          <p className="text-center text-xs text-slate-400">Export Excel ใช้ได้บนคอมพิวเตอร์</p>
        </div>
      </MobileView>

      <DesktopView>
        <div className="space-y-4">
          <PageHeader title="ใบเบิกทั้งหมด" subtitle="ค้นหา กรอง และส่งออกข้อมูลการเบิกจ่าย"
            actions={
              <button disabled title="เชื่อมต่อใน Phase 5" className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white opacity-60">
                <Download size={18} /> Export Excel
              </button>
            } />
          {bar}
          <ExpenseTable items={rows} showEmployee hrefBase="/admin/expenses" />
        </div>
      </DesktopView>
    </>
  );
}
