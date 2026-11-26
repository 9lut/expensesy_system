import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Ban, Banknote, Image as ImageIcon, Pencil } from "lucide-react";
import { getStore } from "@/server/index";
import { EDITABLE, TYPE_META, baht, thDate } from "@/lib/meta";
import type { Expense } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Stepper, Timeline } from "@/components/ui/Timeline";
import { DesktopView, MobileView } from "@/components/ui/Responsive";
import { thCls } from "@/components/ui/table-styles";
import { PrintMenu } from "@/components/print/PrintMenu";

function ReceiptThumbs({ n }: { n: number }) {
  if (n === 0) return <span className="text-xs text-slate-400">ไม่มีไฟล์แนบ</span>;
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="grid size-11 place-items-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 ring-1 ring-slate-200">
          <ImageIcon size={16} />
        </span>
      ))}
    </div>
  );
}

function Notice({ e }: { e: Expense }) {
  if (e.rejectReason) {
    const returned = e.status === "returned";
    return (
      <p className={`flex items-start gap-2 rounded-2xl p-4 text-sm ${returned ? "bg-violet-50 text-violet-800" : "bg-rose-50 text-rose-700"}`}>
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <span><b>{returned ? "ส่งกลับแก้ไข: " : "ไม่อนุมัติ: "}</b>{e.rejectReason}</span>
      </p>
    );
  }
  if (e.payment) {
    return (
      <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
        <Banknote size={18} className="mt-0.5 shrink-0" />
        <span>จ่ายแล้ว {thDate(e.payment.at)} · {e.payment.method} · อ้างอิง {e.payment.ref}</span>
      </p>
    );
  }
  return null;
}

export default async function ExpenseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Phase 3 จะตรวจว่าเป็นเจ้าของใบเบิก (ตอนนี้ยังไม่มี session)
  const e = await getStore().getExpense(id);
  if (!e) notFound();
  const T = TYPE_META[e.type];
  const editable = EDITABLE.includes(e.status);
  const cancellable = editable || e.status === "pending";

  return (
    <>
      {/* ───────── มือถือ ───────── */}
      <MobileView>
        <div className="space-y-4">
          <section className="rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200/70">
            <span className="mx-auto grid place-items-center text-slate-400"><T.icon size={28} /></span>
            <p className="mt-3 text-sm text-slate-500">{T.label} · {e.id}</p>
            <h1 className="text-lg font-bold">{e.title}</h1>
            <p className="mt-2 text-4xl font-bold tabular-nums">{baht(e.total)}</p>
            <div className="mt-3"><StatusBadge status={e.status} /></div>
          </section>

          <Notice e={e} />

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <h2 className="mb-2 font-bold">รายการ ({e.items.length})</h2>
            <ul className="divide-y divide-slate-100">
              {e.items.map((it, i) => (
                <li key={i} className="space-y-2 py-3">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{it.description}</p>
                      <p className="text-xs text-slate-500">{thDate(it.date)} · {it.category}</p>
                    </div>
                    <p className="font-bold tabular-nums">{baht(it.amount)}</p>
                  </div>
                  {it.overLimit && <p className="flex items-center gap-1 text-xs font-bold text-amber-600"><AlertTriangle size={13} /> เกินวงเงินของหมวด</p>}
                  <ReceiptThumbs n={it.receipts} />
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <h2 className="mb-4 font-bold">ความคืบหน้า</h2>
            <Timeline history={e.history} />
          </section>

          {cancellable && (
            <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-slate-200 bg-white/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 py-3.5 font-bold text-rose-600">
                <Ban size={18} /> ยกเลิก
              </button>
              {editable && (
                <Link href="/new" className="flex flex-[2] items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-600/25">
                  <Pencil size={18} /> แก้ไขและส่งใหม่
                </Link>
              )}
            </div>
          )}
        </div>
      </MobileView>

      {/* ───────── คอม ───────── */}
      <DesktopView>
        <div className="space-y-6">
          <PageHeader
            title={e.title}
            subtitle={`${e.id} · ${T.label}`}
            actions={
              <>
                <Link href="/history" className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  <ArrowLeft size={16} /> กลับ
                </Link>
                <PrintMenu e={e} />
                {cancellable && <button className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">ยกเลิกใบเบิก</button>}
                {editable && (
                  <Link href="/new" className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-600/20">
                    <Pencil size={16} /> แก้ไข
                  </Link>
                )}
              </>
            }
          />

          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm"><Stepper e={e} /></div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <dl className="grid grid-cols-2 gap-5 text-sm lg:grid-cols-5">
                  <div><dt className="text-slate-500">ผู้เบิก</dt><dd className="font-bold">{e.employee}</dd></div>
                  <div><dt className="text-slate-500">แผนก</dt><dd className="font-bold">{e.department}</dd></div>
                  <div><dt className="text-slate-500">วันที่สร้าง</dt><dd className="font-bold">{thDate(e.createdAt)}</dd></div>
                  <div><dt className="text-slate-500">ผู้อนุมัติ</dt><dd className="font-bold">{e.approver ?? "–"}</dd></div>
                  <div><dt className="text-slate-500">สถานะ</dt><dd><StatusBadge status={e.status} /></dd></div>
                </dl>
              </section>
              <Notice e={e} />
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200">
                    <tr><th className={thCls}>วันที่</th><th className={thCls}>รายละเอียด</th><th className={thCls}>หมวด</th><th className={thCls}>ใบเสร็จ</th><th className={`${thCls} text-right`}>จำนวนเงิน</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {e.items.map((it, i) => (
                      <tr key={i}>
                        <td className="px-5 py-3">{thDate(it.date)}</td>
                        <td className="px-3 py-3 font-semibold">
                          {it.description}
                          {it.overLimit && <span className="ml-2 inline-flex items-center gap-0.5 text-xs font-bold text-amber-600"><AlertTriangle size={12} /> เกินวงเงิน</span>}
                        </td>
                        <td className="px-3 py-3 text-slate-600">{it.category}</td>
                        <td className="px-3 py-3"><ReceiptThumbs n={it.receipts} /></td>
                        <td className="px-5 py-3 text-right font-bold tabular-nums">{baht(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50/70">
                    <tr><td colSpan={4} className="px-5 py-3 font-bold">รวมทั้งสิ้น</td><td className="px-5 py-3 text-right text-lg font-bold tabular-nums text-blue-600">{baht(e.total)}</td></tr>
                  </tfoot>
                </table>
              </section>
            </div>
            <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-bold">ประวัติการดำเนินการ</h2>
              <Timeline history={e.history} />
            </section>
          </div>
        </div>
      </DesktopView>
    </>
  );
}
