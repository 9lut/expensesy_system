import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Landmark } from "lucide-react";
import { BANK_ACCOUNTS } from "@/lib/mock";
import { getStore } from "@/server/index";
import { TYPE_META, baht, thDate } from "@/lib/meta";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Stepper } from "@/components/ui/Timeline";
import { ReviewPanel } from "@/components/admin/ReviewPanel";
import { PrintMenu } from "@/components/print/PrintMenu";

/** หน้าที่ต้องไปทำงานต่อ ตามสถานะของใบเบิก */
const NEXT: Partial<Record<string, { href: string; label: string }>> = {
  pending: { href: "/admin/approvals", label: "ไปหน้าอนุมัติ" },
  approved: { href: "/admin/payments", label: "ไปตรวจเอกสาร" },
  awaiting_payment: { href: "/admin/payments", label: "ไปบันทึกการจ่าย" },
  clearing: { href: "/admin/advances", label: "ไปตรวจยอดเงินยืม" },
};

/** รายละเอียดใบเบิก (มุมมองแอดมิน) — อยู่ใน Sidebar แอดมิน ไม่สลับไปหน้าพนักงาน */
export default async function AdminExpenseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await getStore().getExpense(id);
  if (!e) notFound();
  const next = NEXT[e.status];
  const bank = BANK_ACCOUNTS[e.employeeId];

  return (
    <div className="space-y-5">
      <PageHeader
        title={e.title}
        subtitle={`${e.id} · ${TYPE_META[e.type].label} · ${e.employee}`}
        actions={
          <>
            <StatusBadge status={e.status} />
            <Link href="/admin/expenses" className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
              <ArrowLeft size={16} /> ใบเบิกทั้งหมด
            </Link>
            <PrintMenu e={e} />
            {next && (
              <Link href={next.href} className="flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20">
                {next.label} <ArrowRight size={16} />
              </Link>
            )}
          </>
        }
      />
      <div className="hidden rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm md:block"><Stepper e={e} /></div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><ReviewPanel e={e} /></section>
        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold">ข้อมูลเอกสาร</h2>
            <dl className="space-y-2 text-sm">
              {[
                ["ผู้เบิก", e.employee],
                ["แผนก", e.department],
                ["วันที่สร้าง", thDate(e.createdAt)],
                ["ผู้อนุมัติ", e.approver ?? "–"],
                ["จำนวนรายการ", `${e.items.length} รายการ`],
                ["ยอดรวม", baht(e.total)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-slate-500">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
              ))}
            </dl>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold"><Landmark size={15} className="text-slate-400" /> การจ่ายเงิน</h2>
            {e.payment ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">วันที่จ่าย</dt><dd className="font-semibold">{thDate(e.payment.at)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">ช่องทาง</dt><dd className="font-semibold">{e.payment.method}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">อ้างอิง</dt><dd className="font-mono font-semibold">{e.payment.ref}</dd></div>
              </dl>
            ) : (
              <p className="text-sm text-slate-500">ยังไม่จ่าย</p>
            )}
            {bank && <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">บัญชีรับเงิน: {bank.bank} {bank.no}</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}
