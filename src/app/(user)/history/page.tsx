"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CURRENT_USER, EXPENSES } from "@/lib/mock";
import { DONE, EDITABLE, IN_PROGRESS, STATUS_META, TYPE_META, baht, thMonth } from "@/lib/meta";
import type { Expense, ExpenseStatus } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Chips } from "@/components/ui/Chips";
import { ExpenseCards, ExpenseTable } from "@/components/ui/ExpenseList";
import { FilterBar, inDateRange, type FilterFacet } from "@/components/ui/FilterBar";
import { DesktopView, MobileView } from "@/components/ui/Responsive";

type Group = "all" | "progress" | "fix" | "done";
const GROUPS: Record<Group, (s: ExpenseStatus) => boolean> = {
  all: () => true,
  progress: (s) => IN_PROGRESS.includes(s),
  fix: (s) => EDITABLE.includes(s),
  done: (s) => DONE.includes(s),
};
const opts = (m: Record<string, { label: string }>) => Object.entries(m).map(([value, v]) => ({ value, label: v.label }));

export default function HistoryPage() {
  const mine = [...EXPENSES.filter((e) => e.employeeId === CURRENT_USER.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // มือถือ: แยกกลุ่มด้วยชิปแบบง่าย
  const [group, setGroup] = useState<Group>("all");
  const count = (g: Group) => mine.filter((e) => GROUPS[g](e.status)).length;
  const byMonth = mine.filter((e) => GROUPS[group](e.status)).reduce<Record<string, Expense[]>>((acc, e) => {
    (acc[thMonth(e.createdAt)] ??= []).push(e);
    return acc;
  }, {});

  // คอม: FilterBar แบบ ikwah
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string[]>([]);
  const [type, setType] = useState<string[]>([]);
  const [range, setRange] = useState<string[]>([]);
  const facets: FilterFacet[] = [
    { id: "date", label: "วันที่เบิก", type: "dateRange", selected: range, onChange: setRange },
    { id: "status", label: "สถานะ", options: opts(STATUS_META), selected: status, onChange: setStatus },
    { id: "type", label: "ประเภท", options: opts(TYPE_META), selected: type, onChange: setType },
  ];
  const rows = mine.filter((e) =>
    (!status.length || status.includes(e.status)) &&
    (!type.length || type.includes(e.type)) &&
    inDateRange(e.createdAt, range) &&
    (e.title + e.id).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <MobileView>
        <div className="space-y-4">
          <Chips value={group} onChange={setGroup} options={[
            { value: "all", label: "ทั้งหมด", count: count("all") },
            { value: "progress", label: "กำลังดำเนินการ", count: count("progress") },
            { value: "fix", label: "ต้องแก้ไข", count: count("fix") },
            { value: "done", label: "เสร็จสิ้น", count: count("done") },
          ]} />
          {Object.keys(byMonth).length === 0 && <ExpenseCards items={[]} />}
          {Object.entries(byMonth).map(([month, list]) => (
            <section key={month} className="space-y-2.5">
              <h2 className="px-1 text-sm font-bold text-slate-500">{month}</h2>
              <ExpenseCards items={list} />
            </section>
          ))}
        </div>
      </MobileView>

      <DesktopView>
        <div className="space-y-4">
          <PageHeader title="ใบเบิกของฉัน" subtitle={`ทั้งหมด ${mine.length} รายการ`}
            actions={
              <Link href="/new" className="flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
                <Plus size={18} /> สร้างใบเบิก
              </Link>
            } />
          <FilterBar searchValue={q} onSearchChange={setQ} searchPlaceholder="ค้นหาเลขที่ / หัวข้อ" facets={facets}
            totalItems={rows.length} itemNoun="ใบเบิก" summary={<>รวม <b className="tabular-nums text-slate-900">{baht(rows.reduce((a, e) => a + e.total, 0))}</b></>} />
          <ExpenseTable items={rows} />
        </div>
      </DesktopView>
    </>
  );
}
