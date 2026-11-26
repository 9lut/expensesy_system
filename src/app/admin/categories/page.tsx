"use client";

import { useState } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { CATEGORIES } from "@/lib/mock";
import { TYPE_META, baht } from "@/lib/meta";
import type { Category, ExpenseType } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Field";
import { RowMenu, type RowAction } from "@/components/ui/RowMenu";
import { DesktopView, MobileView } from "@/components/ui/Responsive";

const limitText = (limit?: number, unit?: string) => (limit ? `${baht(limit)} / ${unit}` : "ไม่จำกัด");
const blank = (): Category => ({ id: "", name: "", appliesTo: ["general"], receiptRequired: true, active: true, accountCode: "", accountName: "" });

/** ฟอร์มเพิ่ม/แก้ไขหมวด */
function CategoryForm({ value, onChange }: { value: Category; onChange: (c: Category) => void }) {
  const set = (p: Partial<Category>) => onChange({ ...value, ...p });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="ชื่อหมวด"><Input value={value.name} onChange={(e) => set({ name: e.target.value })} placeholder="เช่น ค่าน้ำมัน" /></Field>
      <Field label="รหัสบัญชี"><Input value={value.accountCode} onChange={(e) => set({ accountCode: e.target.value })} placeholder="5311" className="font-mono" /></Field>
      <div className="sm:col-span-2"><Field label="ชื่อบัญชี (ผังบัญชี)"><Input value={value.accountName} onChange={(e) => set({ accountName: e.target.value })} placeholder="ค่าน้ำมันเชื้อเพลิง" /></Field></div>
      <div className="sm:col-span-2">
        <p className="mb-1.5 text-sm font-bold text-slate-700">ใช้กับประเภท</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_META) as ExpenseType[]).map((t) => {
            const on = value.appliesTo.includes(t);
            return (
              <label key={t} className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ring-1 ${on ? "bg-blue-50 text-blue-700 ring-blue-300" : "ring-slate-200"}`}>
                <input type="checkbox" checked={on} className="size-4 accent-blue-600"
                  onChange={() => set({ appliesTo: on ? value.appliesTo.filter((x) => x !== t) : [...value.appliesTo, t] })} />
                {TYPE_META[t].label}
              </label>
            );
          })}
        </div>
      </div>
      <Field label="วงเงิน (บาท) — เว้นว่าง = ไม่จำกัด"><Input inputMode="decimal" value={value.limit ?? ""} onChange={(e) => set({ limit: e.target.value ? Number(e.target.value) : undefined })} /></Field>
      <Field label="ต่อ"><Input value={value.limitUnit ?? ""} onChange={(e) => set({ limitUnit: e.target.value })} placeholder="รายการ / วัน / คืน" /></Field>
      <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
        <input type="checkbox" checked={value.receiptRequired} onChange={(e) => set({ receiptRequired: e.target.checked })} className="size-4 accent-blue-600" />
        บังคับแนบใบเสร็จ
      </label>
    </div>
  );
}

export default function CategoriesPage() {
  const [cats, setCats] = useState(CATEGORIES);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const isNew = editing && !editing.id;

  const save = () => {
    if (!editing) return;
    setCats((l) => (editing.id ? l.map((c) => (c.id === editing.id ? editing : c)) : [...l, { ...editing, id: `C${String(l.length + 1).padStart(2, "0")}` }]));
    setEditing(null);
  };
  const actions = (c: Category): RowAction[] => [
    { label: "แก้ไข", icon: Pencil, onClick: () => setEditing(c) },
    { label: c.active ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: Power, onClick: () => setCats((l) => l.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x))) },
    { label: "ลบหมวด", icon: Trash2, danger: true, onClick: () => setDeleting(c) },
  ];

  const formValid = !!editing?.name.trim() && !!editing?.accountCode.trim() && (editing?.appliesTo.length ?? 0) > 0;
  const dialogs = (variant: "sheet" | "modal") => (
    <>
      <Dialog variant={variant} open={!!editing} onClose={() => setEditing(null)} title={isNew ? "เพิ่มหมวดค่าใช้จ่าย" : "แก้ไขหมวดค่าใช้จ่าย"}
        footer={<div className="flex justify-end gap-2"><button onClick={() => setEditing(null)} className="h-10 rounded-xl border border-slate-200 px-4 font-bold text-slate-600">ยกเลิก</button><button disabled={!formValid} onClick={save} className="h-10 rounded-xl bg-blue-600 px-5 font-bold text-white disabled:opacity-40">บันทึก</button></div>}>
        {editing && <CategoryForm value={editing} onChange={setEditing} />}
      </Dialog>
      <Dialog variant={variant} open={!!deleting} onClose={() => setDeleting(null)} title="ลบหมวดค่าใช้จ่าย?"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setDeleting(null)} className="h-10 rounded-xl border border-slate-200 px-4 font-bold text-slate-600">ยกเลิก</button><button onClick={() => { setCats((l) => l.filter((c) => c.id !== deleting?.id)); setDeleting(null); }} className="h-10 rounded-xl bg-rose-600 px-5 font-bold text-white">ลบหมวด</button></div>}>
        {deleting && (
          <div className="space-y-2 text-sm text-slate-600">
            <p>ลบ <b className="text-slate-900">{deleting.name}</b> ({deleting.accountCode}) ออกจากรายการ</p>
            <p className="rounded-lg bg-amber-50 p-3 text-amber-800">ใบเบิกเดิมที่ใช้หมวดนี้ยังเก็บไว้ตามเดิม — ถ้าแค่ไม่อยากให้เลือกใหม่ ใช้ “ปิดใช้งาน” แทนได้</p>
          </div>
        )}
      </Dialog>
    </>
  );

  return (
    <>
      <MobileView>
        <div className="space-y-2.5">
          {cats.map((c) => (
            <div key={c.id} className={`flex items-start gap-2 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200/70 ${c.active ? "" : "opacity-60"}`}>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{c.name} <span className="font-mono text-xs text-slate-400">{c.accountCode}</span></p>
                <p className="text-xs text-slate-500">{c.appliesTo.map((t) => TYPE_META[t].label).join(" · ")}</p>
                <p className="mt-1 text-xs">วงเงิน <b>{limitText(c.limit, c.limitUnit)}</b> · {c.receiptRequired ? "ต้องมีใบเสร็จ" : "ไม่ต้องมีใบเสร็จ"}{!c.active && " · ปิดใช้งาน"}</p>
              </div>
              <RowMenu actions={actions(c)} label={`คำสั่งของ ${c.name}`} />
            </div>
          ))}
          <button onClick={() => setEditing(blank())} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-300 py-3 font-bold text-blue-600"><Plus size={18} /> เพิ่มหมวด</button>
        </div>
        {dialogs("sheet")}
      </MobileView>

      <DesktopView>
        <div className="space-y-5">
          <PageHeader title="หมวดค่าใช้จ่าย" subtitle={`${cats.length} หมวด · เปิดใช้งาน ${cats.filter((c) => c.active).length} · กำหนดรหัสบัญชี วงเงิน และการบังคับแนบใบเสร็จ`}
            actions={<button onClick={() => setEditing(blank())} className="flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20"><Plus size={18} /> เพิ่มหมวด</button>} />
          <DataTable rows={cats} rowKey={(c) => c.id} onRowClick={setEditing}
            columns={[
              { key: "name", header: "หมวด", sort: (c) => c.name, cell: (c) => <div className={c.active ? "" : "opacity-50"}><p className="font-bold">{c.name}</p><p className="text-xs text-slate-400">{c.id}</p></div> },
              { key: "account", header: "รหัสบัญชี", sort: (c) => c.accountCode, cell: (c) => <><p className="font-mono font-bold">{c.accountCode}</p><p className="text-xs text-slate-500">{c.accountName}</p></> },
              { key: "type", header: "ใช้กับประเภท", cell: (c) => <div className="flex flex-wrap gap-1">{c.appliesTo.map((t) => <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{TYPE_META[t].label}</span>)}</div> },
              { key: "limit", header: "วงเงิน", sort: (c) => c.limit ?? Infinity, cell: (c) => <span className="tabular-nums">{limitText(c.limit, c.limitUnit)}</span> },
              { key: "receipt", header: "ใบเสร็จ", sort: (c) => (c.receiptRequired ? 0 : 1), cell: (c) => (c.receiptRequired ? <span className="font-bold">บังคับ</span> : <span className="text-slate-400">ไม่บังคับ</span>) },
              { key: "active", header: "สถานะ", sort: (c) => (c.active ? 0 : 1), cell: (c) => (c.active ? <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600"><span className="size-2 rounded-full bg-emerald-500" />เปิด</span> : <span className="inline-flex items-center gap-1.5 text-slate-400"><span className="size-2 rounded-full bg-slate-300" />ปิด</span>) },
              { key: "act", header: "", align: "right", className: "w-14", cell: (c) => <RowMenu actions={actions(c)} label={`คำสั่งของ ${c.name}`} /> },
            ]} />
        </div>
        {dialogs("modal")}
      </DesktopView>
    </>
  );
}
