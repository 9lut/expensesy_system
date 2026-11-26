"use client";

import { useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Undo2, X } from "lucide-react";
import { EXPENSES } from "@/lib/mock";
import { TYPE_META, baht, thDate } from "@/lib/meta";
import type { Expense } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/ExpenseList";
import { Textarea } from "@/components/ui/Field";
import { DesktopView, MobileView } from "@/components/ui/Responsive";
import { ReviewPanel } from "@/components/admin/ReviewPanel";
import { DataTable } from "@/components/ui/DataTable";

type Decision = "approve" | "return" | "reject";

/** คิวรออนุมัติ (สถานะจำลองในหน่วยความจำ) */
function useQueue() {
  const [queue, setQueue] = useState(EXPENSES.filter((e) => e.status === "pending"));
  const [toast, setToast] = useState("");
  const decide = (ids: string[], d: Decision) => {
    setQueue((q) => q.filter((e) => !ids.includes(e.id)));
    setToast(`${d === "approve" ? "อนุมัติ" : d === "return" ? "ส่งกลับแก้ไข" : "ไม่อนุมัติ"} ${ids.length} รายการ · แจ้งพนักงานทาง LINE แล้ว`);
    setTimeout(() => setToast(""), 2500);
  };
  return { queue, decide, toast };
}

function Toast({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="fixed left-1/2 top-4 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-xl">
      <CheckCircle2 size={18} className="text-emerald-400" /> {text}
    </div>
  );
}

/** ช่องเหตุผล (ต้องกรอกเมื่อส่งกลับ / ไม่อนุมัติ) */
const PRESET_REASONS: Record<"return" | "reject", string[]> = {
  return: ["ใบเสร็จไม่ชัด กรุณาถ่ายใหม่", "ยอดที่เบิกไม่ตรงกับใบเสร็จ", "ขาดใบเสร็จบางรายการ", "ขอใบกำกับภาษีเต็มรูป", "เลขผู้เสียภาษีไม่ถูกต้อง"],
  reject: ["ไม่ใช่ค่าใช้จ่ายในงาน", "เกินวงเงินที่บริษัทกำหนด", "เบิกซ้ำกับใบเบิกเดิม", "เอกสารเกินระยะเวลาเบิก"],
};

/** เหตุผล (ต้องกรอกเมื่อส่งกลับ / ไม่อนุมัติ) — กดเลือกข้อความสำเร็จรูปได้ */
function ReasonBox({ mode, reason, setReason }: { mode: Decision; reason: string; setReason: (v: string) => void }) {
  if (mode === "approve") return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESET_REASONS[mode].map((r) => (
          <button key={r} type="button" onClick={() => setReason(r)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition ${reason === r ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}>
            {r}
          </button>
        ))}
      </div>
      <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
        placeholder={mode === "return" ? "หรือพิมพ์สิ่งที่ต้องแก้ไขเอง" : "หรือพิมพ์เหตุผลเอง"} />
    </div>
  );
}

/* ───────── มือถือ: การ์ด → Bottom Sheet ปุ่มใหญ่ ───────── */
function MobileApprovals() {
  const { queue, decide, toast } = useQueue();
  const [open, setOpen] = useState<Expense | null>(null);
  const [mode, setMode] = useState<Decision>("approve");
  const [reason, setReason] = useState("");
  const close = () => { setOpen(null); setMode("approve"); setReason(""); };
  const confirm = (d: Decision) => { if (open) decide([open.id], d); close(); };

  return (
    <div className="space-y-3">
      <Toast text={toast} />
      <p className="px-1 text-sm text-slate-500">รออนุมัติ {queue.length} รายการ · {baht(queue.reduce((a, e) => a + e.total, 0))}</p>
      {queue.length === 0 && <EmptyState text="ไม่มีรายการรออนุมัติ 🎉" />}
      {queue.map((e) => {
        const T = TYPE_META[e.type];
        return (
          <button key={e.id} onClick={() => setOpen(e)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left shadow-sm ring-1 ring-slate-200/70 active:scale-[.99]">
            <span className="grid shrink-0 place-items-center text-slate-400"><T.icon size={22} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{e.title}</p>
              <p className="truncate text-xs text-slate-500">{e.employee} · {thDate(e.createdAt)}</p>
              {e.items.some((i) => i.overLimit) && <p className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-600"><AlertTriangle size={12} /> เกินวงเงิน</p>}
            </div>
            <p className="font-bold tabular-nums">{baht(e.total)}</p>
          </button>
        );
      })}

      <Dialog variant="sheet" open={!!open} onClose={close} title="ตรวจใบเบิก"
        footer={mode === "approve" ? (
          <div className="space-y-2">
            <button onClick={() => confirm("approve")} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-600/25"><Check size={22} /> อนุมัติ</button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setMode("return")} className="flex items-center justify-center gap-1.5 rounded-2xl border border-violet-200 py-3.5 font-bold text-violet-700"><Undo2 size={18} /> ส่งกลับแก้ไข</button>
              <button onClick={() => setMode("reject")} className="flex items-center justify-center gap-1.5 rounded-2xl border border-rose-200 py-3.5 font-bold text-rose-600"><X size={18} /> ไม่อนุมัติ</button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <ReasonBox mode={mode} reason={reason} setReason={setReason} />
            <div className="flex gap-2">
              <button onClick={() => setMode("approve")} className="rounded-2xl border border-slate-200 px-5 py-3.5 font-bold text-slate-600">ย้อนกลับ</button>
              <button disabled={!reason.trim()} onClick={() => confirm(mode)}
                className={`flex-1 rounded-2xl py-3.5 font-bold text-white disabled:opacity-40 ${mode === "return" ? "bg-violet-600" : "bg-rose-600"}`}>
                ยืนยัน{mode === "return" ? "ส่งกลับแก้ไข" : "ไม่อนุมัติ"}
              </button>
            </div>
          </div>
        )}>
        {open && <ReviewPanel e={open} />}
      </Dialog>
    </div>
  );
}

/* ───────── คอม: รายการซ้าย + รายละเอียดขวา + อนุมัติหลายรายการ ───────── */
function DesktopApprovals() {
  const { queue, decide, toast } = useQueue();
  const [selectedId, setSelectedId] = useState<string | null>(queue[0]?.id ?? null);
  const [checked, setChecked] = useState<string[]>([]);
  const [mode, setMode] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");
  const selected = queue.find((e) => e.id === selectedId) ?? queue[0];

  const finish = (ids: string[], d: Decision) => {
    decide(ids, d);
    setChecked((c) => c.filter((x) => !ids.includes(x)));
    setMode(null);
    setReason("");
  };

  return (
    <div className="space-y-6">
      <Toast text={toast} />
      <PageHeader
        title="รออนุมัติ"
        subtitle={`${queue.length} รายการ · ${baht(queue.reduce((a, e) => a + e.total, 0))}`}
        actions={
          <button disabled={!checked.length} onClick={() => finish(checked, "approve")}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 disabled:opacity-40 disabled:shadow-none">
            <Check size={18} /> อนุมัติที่เลือก ({checked.length})
          </button>
        }
      />
      {queue.length === 0 ? <EmptyState text="ไม่มีรายการรออนุมัติ 🎉" /> : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          {/* items-start: ตารางซ้ายสูงเท่าข้อมูล ไม่ยืดตามแผงรายละเอียดขวา */}
          <DataTable rows={queue} rowKey={(e) => e.id} minWidth={560}
            onRowClick={(e) => setSelectedId(e.id)} activeKey={selected?.id}
            selection={{ selected: checked, onChange: setChecked }}
            columns={[
              {
                key: "title", header: "ใบเบิก", sort: (e) => e.title,
                cell: (e) => {
                  const T = TYPE_META[e.type];
                  return (
                    <>
                      <p className="flex items-center gap-1.5 font-bold"><T.icon size={14} className="text-slate-400" />{e.title}</p>
                      <p className="flex items-center gap-2 text-xs text-slate-400">{e.id}{e.items.some((i) => i.overLimit) && <span className="inline-flex items-center gap-0.5 font-bold text-amber-600"><AlertTriangle size={12} /> เกินวงเงิน</span>}</p>
                    </>
                  );
                },
              },
              { key: "employee", header: "พนักงาน", sort: (e) => e.employee, cell: (e) => <>{e.employee}<div className="text-xs text-slate-400">{e.department}</div></> },
              { key: "date", header: "ส่งเมื่อ", sort: (e) => e.createdAt, cell: (e) => <span className="whitespace-nowrap text-slate-600">{thDate(e.createdAt)}</span> },
              { key: "total", header: "ยอด", align: "right", sort: (e) => e.total, cell: (e) => <span className="font-bold tabular-nums">{baht(e.total)}</span> },
            ]} />

          {selected && (
            <aside className="flex h-fit flex-col rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-0">
              <div className="p-5"><ReviewPanel e={selected} /></div>
              <div className="space-y-2 border-t border-slate-100 p-5">
                {mode && mode !== "approve" ? (
                  <>
                    <ReasonBox mode={mode} reason={reason} setReason={setReason} />
                    <div className="flex gap-2">
                      <button onClick={() => { setMode(null); setReason(""); }} className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600">ยกเลิก</button>
                      <button disabled={!reason.trim()} onClick={() => finish([selected.id], mode)}
                        className={`flex-1 rounded-xl py-2.5 font-bold text-white disabled:opacity-40 ${mode === "return" ? "bg-violet-600" : "bg-rose-600"}`}>
                        ยืนยัน{mode === "return" ? "ส่งกลับแก้ไข" : "ไม่อนุมัติ"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
                    <button onClick={() => finish([selected.id], "approve")} className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 font-bold text-white shadow-lg shadow-emerald-600/20"><Check size={18} /> อนุมัติ</button>
                    <button onClick={() => setMode("return")} className="rounded-xl border border-violet-200 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-50">ส่งกลับ</button>
                    <button onClick={() => setMode("reject")} className="rounded-xl border border-rose-200 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50">ไม่อนุมัติ</button>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <>
      <MobileView><MobileApprovals /></MobileView>
      <DesktopView><DesktopApprovals /></DesktopView>
    </>
  );
}
