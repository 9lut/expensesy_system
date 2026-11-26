import Link from "next/link";
import {
  AlertTriangle, Banknote, Building2, ChevronRight, ClipboardCheck, Clock, FileText, ReceiptText,
  ScanText, TrendingDown, TrendingUp, Undo2, Wallet,
} from "lucide-react";
import { EXPENSES, MONTHLY_STATS, daysFromToday, isOpenAdvance } from "@/lib/mock";
import { STATUS_META, TYPE_META, baht, thDate } from "@/lib/meta";
import { DonutChart, VolumeTrend } from "@/components/charts/Charts";
import { byAccount, byDepartment, kpis, monthCompare, pipeline, topEmployees } from "@/lib/dashboard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { HeroCard } from "@/components/ui/HeroCard";
import { MonthlyChart } from "@/components/ui/MonthlyChart";
import { ExpenseTable } from "@/components/ui/ExpenseList";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DesktopView, MobileView } from "@/components/ui/Responsive";

const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const pct = (n: number) => `${n.toFixed(0)}%`;

/** หัวการ์ดมาตรฐานของแดชบอร์ด */
function CardHead({ title, hint, href }: { title: string; hint?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-bold">{title}</h2>
        {hint && <p className="truncate text-xs text-slate-400">{hint}</p>}
      </div>
      {href && <Link href={href} className="shrink-0 text-xs font-bold text-blue-600">ดูทั้งหมด</Link>}
    </div>
  );
}

export default function AdminDashboard() {
  const by = (...s: string[]) => EXPENSES.filter((e) => s.includes(e.status));
  const sum = (l: typeof EXPENSES) => l.reduce((a, e) => a + e.total, 0);
  const pending = by("pending");
  const toVerify = by("approved");
  const toPay = by("awaiting_payment");
  const overdue = EXPENSES.filter((e) => isOpenAdvance(e) && daysFromToday(e.advanceDueDate!) < 0);
  const clearing = by("clearing");
  const actions = [...pending, ...toVerify, ...toPay, ...clearing].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const mc = monthCompare();
  const k = kpis(EXPENSES);
  const pipe = pipeline(EXPENSES);
  const pipeTotal = pipe.reduce((a, p) => a + p.count, 0) || 1;
  const depts = byDepartment(EXPENSES);
  const accounts = byAccount(EXPENSES);
  const top = topEmployees(EXPENSES);
  const up = mc.change >= 0;
  const counted = EXPENSES.filter((e) => !["draft", "cancelled", "rejected"].includes(e.status));
  const typeShare = (Object.keys(TYPE_META) as (keyof typeof TYPE_META)[]).map((t) => ({
    name: TYPE_META[t].label,
    value: counted.filter((e) => e.type === t).reduce((a, e) => a + e.total, 0),
  }));

  const tasks = [
    { href: "/admin/approvals", icon: ClipboardCheck, label: "รออนุมัติ", n: pending.length, amt: sum(pending), cls: "text-amber-600" },
    { href: "/admin/payments", icon: Banknote, label: "ตรวจเอกสาร / รอจ่าย", n: toVerify.length + toPay.length, amt: sum([...toVerify, ...toPay]), cls: "text-blue-600" },
    { href: "/admin/advances", icon: Wallet, label: "เงินยืมรอตรวจ / เกินกำหนด", n: clearing.length + overdue.length, amt: sum([...clearing, ...overdue]), cls: "text-rose-600" },
  ];

  const kpiTiles = [
    { icon: FileText, label: "ใบเบิกทั้งหมด", value: `${k.claims}`, sub: "ไม่รวมร่าง/ยกเลิก" },
    { icon: ReceiptText, label: "เฉลี่ยต่อใบ", value: baht(k.avgPerClaim), sub: "ยอดต่อใบเบิก" },
    { icon: Clock, label: "อนุมัติเฉลี่ย", value: `${k.avgApprovalDays.toFixed(1)} วัน`, sub: "ส่ง → ตัดสินใจ" },
    { icon: Undo2, label: "ส่งกลับ/ไม่อนุมัติ", value: pct(k.bounceRate), sub: "ของที่ตัดสินแล้ว" },
    { icon: ScanText, label: "ตรวจด้วย OCR", value: pct(k.ocrRate), sub: k.ocrMismatch ? `ยอดไม่ตรง ${k.ocrMismatch} รายการ` : "ยอดตรงทั้งหมด", warn: k.ocrMismatch > 0 },
    { icon: Wallet, label: "เงินยืมคงค้าง", value: baht(k.openAdvance), sub: `${k.openAdvanceCount} รายการ` },
  ];

  return (
    <>
      {/* ───────── มือถือ: เน้นงานที่ต้องทำ + ตัวเลขสำคัญ ───────── */}
      <MobileView>
        <div className="space-y-4">
          <HeroCard label="งานที่รอคุณ" value={`${actions.length} รายการ`} hint={`ยอดรวม ${baht(sum(actions))}`} icon={ClipboardCheck} />
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
            {tasks.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="flex items-center gap-3 px-3.5 py-3 active:bg-slate-50">
                  <t.icon size={20} className={`shrink-0 ${t.cls}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{t.label}</p>
                    <p className="text-xs text-slate-500 tabular-nums">{baht(t.amt)}</p>
                  </div>
                  <span className="text-lg font-bold tabular-nums">{t.n}</span>
                  <ChevronRight size={18} className="text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
          {overdue.length > 0 && (
            <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-sm font-bold text-rose-700"><AlertTriangle size={16} /> เงินยืมเกินกำหนด {overdue.length} รายการ</p>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            {kpiTiles.map((t) => (
              <div key={t.label} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><t.icon size={13} /> {t.label}</p>
                <p className="mt-1 text-base font-bold tabular-nums">{t.value}</p>
                <p className={`truncate text-[11px] ${t.warn ? "font-bold text-rose-600" : "text-slate-400"}`}>{t.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </MobileView>

      {/* ───────── คอม: ภาพรวมแบบละเอียด ───────── */}
      <DesktopView>
        <div className="space-y-5">
          <PageHeader title="แดชบอร์ด" subtitle="ปีงบประมาณ 2569 · ข้อมูล ณ 25 พ.ย. 69" />

          {/* แถว 1: ยอดเดือนนี้ + งานค้าง */}
          <div className="grid gap-4 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <HeroCard label="ยอดเบิกเดือนนี้" value={baht(mc.cur)} icon={up ? TrendingUp : TrendingDown}
                hint={<>{up ? "▲" : "▼"} {Math.abs(mc.change).toFixed(1)}% จากเดือนก่อน ({baht(mc.prev)})</>} />
            </div>
            <StatCard label="รออนุมัติ" value={`${pending.length} รายการ`} hint={baht(sum(pending))} icon={ClipboardCheck} tone="warning" />
            <StatCard label="ตรวจเอกสาร / รอจ่าย" value={`${toVerify.length + toPay.length} รายการ`} hint={baht(sum([...toVerify, ...toPay]))} icon={Banknote} tone="accent" />
            <StatCard label="เงินยืมเกินกำหนด" value={`${overdue.length} รายการ`} hint={baht(sum(overdue))} icon={Wallet} tone="danger" />
          </div>

          {/* แถว 2: ตัวชี้วัด */}
          <div className={`${card} grid grid-cols-3 divide-slate-100 xl:grid-cols-6 xl:divide-x`}>
            {kpiTiles.map((t) => (
              <div key={t.label} className="min-w-0 px-4 py-3.5">
                <p className="flex items-center gap-1.5 truncate text-xs font-bold text-slate-500"><t.icon size={14} className="shrink-0" /> {t.label}</p>
                <p className="mt-1 truncate text-lg font-bold tabular-nums">{t.value}</p>
                <p className={`truncate text-xs ${t.warn ? "font-bold text-rose-600" : "text-slate-400"}`}>{t.sub}</p>
              </div>
            ))}
          </div>

          {/* แถว 3: กราฟ + งานที่ต้องทำ */}
          <div className="grid gap-5 xl:grid-cols-3">
            <section className={`${card} flex flex-col xl:col-span-2`}>
              <CardHead title="ยอดเบิก 12 เดือน แยกตามประเภท" hint="ธ.ค. 68 – พ.ย. 69" />
              <div className="flex flex-1 flex-col p-4"><MonthlyChart fill /></div>
            </section>
            <section className={card}>
              <CardHead title={`ต้องดำเนินการ (${actions.length})`} hint="เรียงจากรอนานที่สุด" />
              <ul className="divide-y divide-slate-100">
                {actions.slice(0, 7).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{e.title}</p>
                      <p className="text-xs text-slate-500">{e.employee} · {thDate(e.createdAt)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums">{baht(e.total)}</p>
                      <StatusBadge status={e.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* แถว 3.5: สัดส่วนประเภท + ปริมาณงาน/เวลาอนุมัติ */}
          <div className="grid gap-5 xl:grid-cols-3">
            <section className={card}>
              <CardHead title="สัดส่วนตามประเภท" hint="ยอดเบิกทั้งปี (ไม่รวมร่าง/ยกเลิก/ไม่อนุมัติ)" />
              <div className="p-4"><DonutChart data={typeShare} centerLabel="รวม (บาท)" /></div>
            </section>
            <section className={`${card} xl:col-span-2`}>
              <CardHead title="ปริมาณงานและความเร็วการอนุมัติ" hint="พื้นที่ = จำนวนใบเบิก · เส้นประ = วันอนุมัติเฉลี่ย (แกนขวา)" />
              <div className="p-4"><VolumeTrend data={MONTHLY_STATS} height={220} /></div>
            </section>
          </div>

          {/* แถว 4: สถานะใบเบิกทุกขั้น */}
          <section className={card}>
            <CardHead title="ใบเบิกตามสถานะ" hint="จำนวนและยอดเงินในแต่ละขั้นตอน" />
            <div className="space-y-4 p-4">
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                {pipe.filter((p) => p.count).map((p) => (
                  <span key={p.status} title={`${STATUS_META[p.status].label} ${p.count}`} style={{ width: `${(p.count / pipeTotal) * 100}%`, background: p.color }} />
                ))}
              </div>
              <div className="grid grid-cols-4 gap-x-6 gap-y-3 xl:grid-cols-8">
                {pipe.map((p) => (
                  <div key={p.status} className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-xs font-bold text-slate-500">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} /> {STATUS_META[p.status].label}
                    </p>
                    <p className="text-lg font-bold tabular-nums">{p.count}</p>
                    <p className="truncate text-xs text-slate-400 tabular-nums">{baht(p.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* แถว 5: แผนก / บัญชีค่าใช้จ่าย / พนักงาน */}
          <div className="grid gap-5 xl:grid-cols-3">
            <section className={card}>
              <CardHead title="ตามแผนก" hint="ยอดเบิกและสัดส่วน" />
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {depts.map((d) => (
                    <tr key={d.dept}>
                      <td className="px-4 py-2.5">
                        <p className="flex items-center gap-1.5 font-semibold"><Building2 size={14} className="text-slate-400" /> {d.dept}</p>
                        <div className="mt-1.5 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${d.share}%` }} /></div>
                      </td>
                      <td className="w-14 px-2 py-2.5 text-right text-xs text-slate-500">{d.count} ใบ</td>
                      <td className="w-28 px-4 py-2.5 text-right">
                        <p className="font-bold tabular-nums">{baht(d.amount)}</p>
                        <p className="text-xs text-slate-400">{pct(d.share)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className={card}>
              <CardHead title="ตามบัญชีค่าใช้จ่าย" hint="รหัสบัญชีตามหมวด (ไม่รวมเงินยืม)" href="/admin/categories" />
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {accounts.map((a) => (
                    <tr key={a.code}>
                      <td className="w-14 px-4 py-2.5 font-mono text-xs font-bold text-slate-500">{a.code}</td>
                      <td className="px-2 py-2.5"><p className="truncate font-semibold">{a.name}</p><p className="text-xs text-slate-400">{a.count} รายการ</p></td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums">{baht(a.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className={card}>
              <CardHead title="พนักงานที่เบิกสูงสุด" hint="5 อันดับ" href="/admin/employees" />
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {top.map((t, i) => (
                    <tr key={t.name}>
                      <td className="w-10 px-4 py-2.5"><span className={`grid size-6 place-items-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span></td>
                      <td className="px-2 py-2.5"><p className="font-semibold">{t.name}</p><p className="text-xs text-slate-400">{t.dept} · {t.count} ใบ</p></td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums">{baht(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          {/* แถว 6: ล่าสุด */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold">ใบเบิกล่าสุด</h2>
              <Link href="/admin/expenses" className="text-xs font-bold text-blue-600">ดูทั้งหมด</Link>
            </div>
            <ExpenseTable items={[...EXPENSES].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)} showEmployee hrefBase="/admin/expenses" />
          </section>
        </div>
      </DesktopView>
    </>
  );
}
