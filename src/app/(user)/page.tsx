import Link from "next/link";
import { AlertTriangle, BadgeCheck, Banknote, ChevronRight, Clock, Plus, ScanLine, Undo2 } from "lucide-react";
import { CURRENT_USER, EXPENSES, MY_MONTHLY, daysFromToday, isOpenAdvance } from "@/lib/mock";
import { SimpleBars } from "@/components/charts/Charts";
import { baht, thDate } from "@/lib/meta";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { HeroCard } from "@/components/ui/HeroCard";
import { ExpenseCards, ExpenseTable } from "@/components/ui/ExpenseList";
import { TypeBars } from "@/components/ui/TypeBars";
import { DesktopView, MobileView } from "@/components/ui/Responsive";

export default function UserHome() {
  const mine = EXPENSES.filter((e) => e.employeeId === CURRENT_USER.id);
  const by = (...s: string[]) => mine.filter((e) => s.includes(e.status));
  const sum = (l: typeof mine) => l.reduce((a, e) => a + e.total, 0);
  const waiting = by("approved", "awaiting_payment");
  const advance = mine.find(isOpenAdvance);
  const returned = by("returned");
  const recent = [...mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // แจ้งเตือนแบบกะทัดรัด: แถวเดียว สีเฉพาะไอคอน/แถบซ้าย
  const advanceAlert = advance && (
    <Link href="/advances" className="flex items-center gap-2.5 border-l-[3px] border-amber-500 bg-white px-3 py-2.5 text-sm active:bg-slate-50">
      <AlertTriangle size={16} className="shrink-0 text-amber-600" />
      <span className="min-w-0 flex-1 truncate"><b>เงินยืม {baht(advance.total)}</b> <span className="text-slate-500">เคลียร์ใน {daysFromToday(advance.advanceDueDate!)} วัน · {thDate(advance.advanceDueDate!)}</span></span>
      <ChevronRight size={16} className="shrink-0 text-slate-300" />
    </Link>
  );
  const returnedAlert = returned.length > 0 && (
    <Link href={`/expenses/${returned[0].id}`} className="flex items-center gap-2.5 border-l-[3px] border-violet-500 bg-white px-3 py-2.5 text-sm active:bg-slate-50">
      <Undo2 size={16} className="shrink-0 text-violet-600" />
      <span className="min-w-0 flex-1 truncate"><b>ส่งกลับแก้ไข {returned.length} ใบ</b> <span className="text-slate-500">{returned[0].rejectReason}</span></span>
      <ChevronRight size={16} className="shrink-0 text-slate-300" />
    </Link>
  );
  const alerts = (advanceAlert || returnedAlert) && (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl shadow-sm ring-1 ring-slate-200/70">{advanceAlert}{returnedAlert}</div>
  );

  return (
    <>
      {/* ───────── มือถือ ───────── */}
      <MobileView>
        <div className="space-y-4">
          <HeroCard label="ยอดรอรับเงิน" value={baht(sum(waiting))} hint={`${waiting.length} ใบเบิก · อนุมัติแล้ว รอโอน`} icon={Banknote}>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                <p className="text-white/75">รออนุมัติ</p>
                <p className="font-bold tabular-nums">{baht(sum(by("pending")))}</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                <p className="text-white/75">ได้รับแล้วปีนี้</p>
                <p className="font-bold tabular-nums">{baht(sum(by("paid", "cleared").filter((e) => e.type !== "advance")))}</p>
              </div>
            </div>
          </HeroCard>

          {alerts}

          <Link href="/new" className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50">
            <ScanLine size={24} className="shrink-0 text-blue-600" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">สแกนใบเสร็จ / เมนูด่วน</span>
              <span className="block truncate text-xs text-slate-500">น้ำมัน · ทางด่วน · แท็กซี่ · ที่พัก · อาหาร · ขอยืมเงิน …</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-slate-300" />
          </Link>

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-bold">ยอดเบิก 6 เดือน</h2>
              <span className="text-xs text-slate-500">เดือนนี้ {baht(MY_MONTHLY[MY_MONTHLY.length - 1].total)}</span>
            </div>
            <SimpleBars data={MY_MONTHLY} height={140} />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">ล่าสุด</h2>
              <Link href="/history" className="text-sm font-bold text-blue-600">ดูทั้งหมด</Link>
            </div>
            <ExpenseCards items={recent.slice(0, 4)} />
          </section>
        </div>
      </MobileView>

      {/* ───────── คอม ───────── */}
      <DesktopView>
        <div className="space-y-6">
          <PageHeader
            title="ภาพรวมของฉัน"
            subtitle={`${CURRENT_USER.department} · ${CURRENT_USER.position}`}
            actions={
              <Link href="/new" className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
                <Plus size={18} /> สร้างใบเบิก
              </Link>
            }
          />
          <div className="grid gap-4 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <HeroCard label="ยอดรอรับเงิน" value={baht(sum(waiting))} hint={`${waiting.length} ใบเบิก · อนุมัติแล้ว รอโอน`} icon={Banknote} />
            </div>
            <StatCard label="รออนุมัติ" value={baht(sum(by("pending")))} hint={`${by("pending").length} รายการ`} icon={Clock} tone="warning" />
            <StatCard label="ได้รับแล้วปีนี้" value={baht(sum(by("paid", "cleared").filter((e) => e.type !== "advance")))} hint={`${by("paid").length} รายการ`} icon={BadgeCheck} tone="success" />
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <section className="space-y-3 xl:col-span-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-bold">ใบเบิกล่าสุด</h2>
                <Link href="/history" className="text-sm font-bold text-blue-600">ดูทั้งหมด</Link>
              </div>
              <ExpenseTable items={recent.slice(0, 6)} />
            </section>
            <aside className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="font-bold">ยอดเบิกของฉัน 6 เดือน</h3>
                  <span className="text-xs text-slate-500">รวม {baht(MY_MONTHLY.reduce((a, x) => a + x.total, 0))}</span>
                </div>
                <SimpleBars data={MY_MONTHLY} height={180} />
              </section>
              <h2 className="px-1 font-bold">ต้องดำเนินการ</h2>
              {alerts}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-bold">ยอดเบิกแยกตามประเภท</h3>
                <TypeBars items={mine} />
              </section>
            </aside>
          </div>
        </div>
      </DesktopView>
    </>
  );
}
