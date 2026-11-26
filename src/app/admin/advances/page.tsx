"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlarmClock, BellRing, CheckCircle2, FileSearch, Hourglass } from "lucide-react";
import { EXPENSES, daysFromToday, isOpenAdvance } from "@/lib/mock";
import { baht, thDate } from "@/lib/meta";
import type { Expense } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { DesktopView, MobileView } from "@/components/ui/Responsive";
import { StepTabs, type Step } from "@/components/admin/StepTabs";
import { HBars } from "@/components/charts/Charts";

type K = "check" | "waiting" | "overdue";
const sum = (l: Expense[]) => l.reduce((a, e) => a + e.total, 0);
const daysLeft = (e: Expense) => daysFromToday(e.advanceDueDate!);

/** ยืม → ใช้จริง → ส่วนต่าง ในภาษาที่อ่านแล้วเข้าใจทันที */
function Breakdown({ e }: { e: Expense }) {
  const actual = e.advanceActual;
  const diff = actual === undefined ? 0 : e.total - actual;
  return (
    <div className="grid grid-cols-3 gap-2 text-center text-sm">
      <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-xs text-slate-500">ยืมไป</p><p className="font-bold tabular-nums">{baht(e.total)}</p></div>
      <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-xs text-slate-500">ใช้จริง</p><p className="font-bold tabular-nums">{actual === undefined ? "–" : baht(actual)}</p></div>
      <div className={`rounded-xl p-2.5 ${diff > 0 ? "bg-amber-50 text-amber-800" : diff < 0 ? "bg-blue-50 text-blue-800" : "bg-emerald-50 text-emerald-800"}`}>
        <p className="text-xs">{diff > 0 ? "พนักงานคืน" : diff < 0 ? "บริษัทจ่ายเพิ่ม" : "ส่วนต่าง"}</p>
        <p className="font-bold tabular-nums">{actual === undefined ? "–" : baht(Math.abs(diff))}</p>
      </div>
    </div>
  );
}

function DueText({ e }: { e: Expense }) {
  const d = daysLeft(e);
  return <span className={`whitespace-nowrap font-bold ${d < 0 ? "text-rose-600" : d <= 3 ? "text-amber-600" : "text-slate-600"}`}>{d < 0 ? `เกินมา ${-d} วัน` : `เหลือ ${d} วัน`}</span>;
}

export default function AdminAdvances() {
  const [list, setList] = useState(EXPENSES.filter((e) => e.type === "advance" && (e.status === "clearing" || isOpenAdvance(e))));
  const [notified, setNotified] = useState<string[]>([]);
  const [tab, setTab] = useState<K>("check");
  const router = useRouter();
  const close = (id: string) => setList((l) => l.filter((e) => e.id !== id));
  const notify = (id: string) => setNotified((n) => [...n, id]);

  const check = list.filter((e) => e.status === "clearing");
  const open = list.filter(isOpenAdvance);
  const overdue = open.filter((e) => daysLeft(e) < 0);
  const waiting = open.filter((e) => daysLeft(e) >= 0);
  const rows = tab === "check" ? check : tab === "waiting" ? waiting : overdue;
  const aging = [
    { name: "รอตรวจยอด", value: sum(check), color: "#93c5fd" },
    { name: "เหลือ > 3 วัน", value: sum(waiting.filter((e) => daysLeft(e) > 3)), color: "#3b82f6" },
    { name: "ใกล้ครบ 0–3 วัน", value: sum(waiting.filter((e) => daysLeft(e) <= 3)), color: "#f59e0b" },
    { name: "เกินกำหนด", value: sum(overdue), color: "#e11d48" },
  ];

  const steps: Step<K>[] = [
    { key: "check", icon: FileSearch, title: "รอตรวจยอดใช้จริง", hint: "พนักงานส่งใบเสร็จแล้ว", count: check.length, amount: sum(check), tone: "bg-blue-50 text-blue-600" },
    { key: "waiting", icon: Hourglass, title: "ยังไม่ส่งใบเสร็จ", hint: "ยังไม่ถึงกำหนด", count: waiting.length, amount: sum(waiting), tone: "bg-amber-50 text-amber-600" },
    { key: "overdue", icon: AlarmClock, title: "เกินกำหนด", hint: "ควรติดตามทันที", count: overdue.length, amount: sum(overdue), tone: "bg-rose-50 text-rose-600" },
  ];

  const action = (e: Expense, big = false) => {
    const size = big ? "h-12 w-full rounded-2xl" : "h-9 rounded-lg px-3 text-xs";
    if (e.status === "clearing") {
      return <button onClick={() => close(e.id)} className={`inline-flex items-center justify-center gap-1.5 bg-emerald-600 font-bold text-white ${size}`}><CheckCircle2 size={big ? 18 : 14} /> ยอดถูกต้อง ปิดเงินยืม</button>;
    }
    const sent = notified.includes(e.id);
    return (
      <button disabled={sent} onClick={() => notify(e.id)} className={`inline-flex items-center justify-center gap-1.5 border border-slate-200 bg-white font-bold text-slate-600 disabled:opacity-50 ${size}`}>
        <BellRing size={big ? 18 : 14} /> {sent ? "ส่งเตือนแล้ว" : "เตือนทาง LINE"}
      </button>
    );
  };

  const columns: Column<Expense>[] = [
    { key: "employee", header: "พนักงาน", sort: (e) => e.employee, cell: (e) => <><p className="font-bold">{e.employee}</p><p className="text-xs text-slate-400">{e.department}</p></> },
    { key: "title", header: "เรื่อง", sort: (e) => e.title, cell: (e) => <>{e.title}<p className="text-xs text-slate-400">{e.id}</p></> },
    ...(tab === "check"
      ? [{ key: "bd", header: "ยืม / ใช้จริง / ส่วนต่าง", cell: (e: Expense) => <div className="w-80"><Breakdown e={e} /></div> }]
      : [
          { key: "due", header: "กำหนดส่งใบเสร็จ", sort: (e: Expense) => e.advanceDueDate!, cell: (e: Expense) => <span className="whitespace-nowrap">{thDate(e.advanceDueDate!)}</span> },
          { key: "left", header: "เหลือเวลา", sort: daysLeft, cell: (e: Expense) => <DueText e={e} /> },
          { key: "total", header: "ยอดยืม", align: "right" as const, sort: (e: Expense) => e.total, cell: (e: Expense) => <span className="font-bold tabular-nums">{baht(e.total)}</span> },
        ]),
    { key: "act", header: "", align: "right", cell: (e) => action(e) },
  ];

  return (
    <>
      <MobileView>
        <div className="space-y-4">
          <StepTabs steps={steps} value={tab} onChange={setTab} sequential={false} />
          {rows.length === 0 && <EmptyState text="ไม่มีรายการ 🎉" />}
          {rows.map((e) => (
            <div key={e.id} className="space-y-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200/70">
              <div className="flex justify-between gap-3">
                <div className="min-w-0"><p className="truncate font-bold">{e.employee}</p><p className="truncate text-xs text-slate-500">{e.title}</p></div>
                {e.status !== "clearing" && <DueText e={e} />}
              </div>
              <Breakdown e={e} />
              {action(e, true)}
            </div>
          ))}
        </div>
      </MobileView>

      <DesktopView>
        <div className="space-y-6">
          <PageHeader title="เงินยืม" subtitle="ติดตามเงินยืมล่วงหน้าจนพนักงานส่งใบเสร็จและปิดยอดครบ" />
          <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:grid-cols-[1fr_260px]">
            <div>
              <h2 className="text-sm font-bold">เงินยืมคงค้างตามระยะเวลา</h2>
              <p className="mb-3 text-xs text-slate-400">ยอดเงินในแต่ละช่วง (นับจากวันครบกำหนดส่งใบเสร็จ)</p>
              <HBars data={aging} height={170} />
            </div>
            <dl className="grid content-center gap-3 border-slate-100 text-sm xl:border-l xl:pl-5">
              <div><dt className="text-xs text-slate-500">คงค้างทั้งหมด</dt><dd className="text-2xl font-bold tabular-nums">{baht(sum(list))}</dd></div>
              <div><dt className="text-xs text-slate-500">เฉลี่ยต่อรายการ</dt><dd className="font-bold tabular-nums">{baht(list.length ? sum(list) / list.length : 0)}</dd></div>
              <div><dt className="text-xs text-slate-500">เกินกำหนด</dt><dd className="font-bold tabular-nums text-rose-600">{baht(sum(overdue))}</dd></div>
            </dl>
          </section>
          <StepTabs steps={steps} value={tab} onChange={setTab} sequential={false} />
          <DataTable rows={rows} columns={columns} rowKey={(e) => e.id} empty="ไม่มีรายการ 🎉" minWidth={860} onRowClick={(e) => router.push(`/admin/expenses/${e.id}`)} />
        </div>
      </DesktopView>
    </>
  );
}
