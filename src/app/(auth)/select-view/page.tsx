import Link from "next/link";
import { ArrowRight, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { getStore } from "@/server/index";
import { requireUser } from "@/server/session";
import { BrandMark } from "@/components/ui/Brand";

/**
 * หลัง Login: บัญชี ADMIN เลือกว่าจะใช้งานมุมมองไหน (USER เข้าหน้าพนักงานทันที ไม่เห็นหน้านี้)
 */
export default async function SelectView() {
  const me = await requireUser({ admin: true });
  const EXPENSES = await getStore().listExpenses();
  const pending = EXPENSES.filter((e) => e.status === "pending").length;
  const toPay = EXPENSES.filter((e) => e.status === "approved" || e.status === "awaiting_payment").length;

  const views = [
    {
      href: "/", icon: UserRound, title: "พนักงาน", desc: "เบิกค่าใช้จ่าย ขอยืมเงิน และติดตามใบเบิกของฉัน",
      cls: "from-slate-700 to-slate-900", note: null,
    },
    {
      href: "/admin", icon: ShieldCheck, title: "แอดมิน", desc: "อนุมัติใบเบิก จ่ายเงิน และจัดการระบบ",
      cls: "from-blue-600 to-violet-600", note: `รออนุมัติ ${pending} · รอจ่าย ${toPay}`,
    },
  ];

  return (
    <div className="grid min-h-dvh place-items-center bg-slate-50 px-5 py-10">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark size={52} />
          <div>
            <h1 className="text-2xl font-bold">สวัสดี, {me.name}</h1>
            <p className="text-slate-500">เลือกมุมมองที่ต้องการใช้งาน</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {views.map((v) => (
            <Link key={v.href} href={v.href}
              className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-blue-300 md:flex-col md:items-start md:p-7">
              <span className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${v.cls}`}><v.icon size={28} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold">{v.title}</p>
                <p className="text-sm text-slate-500">{v.desc}</p>
                {v.note && <p className="mt-2 inline-block rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">{v.note}</p>}
              </div>
              <ArrowRight className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600 md:self-end" />
            </Link>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input type="checkbox" className="size-4 accent-blue-600" /> จำการเลือกนี้ ไม่ต้องถามอีก
          </label>
          <form action="/api/auth/logout" method="post"><button className="flex items-center gap-1.5 font-bold text-slate-500 hover:text-rose-600"><LogOut size={16} /> ออกจากระบบ</button></form>
        </div>
      </div>
    </div>
  );
}
