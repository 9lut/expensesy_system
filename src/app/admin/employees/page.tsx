"use client";

import { useState } from "react";
import { FileUp, KeyRound, MessageCircle, Pencil, Plus, Power, UserRound } from "lucide-react";
import { EMPLOYEES } from "@/lib/mock";
import type { Employee } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input, Select } from "@/components/ui/Field";
import { DesktopView, MobileView } from "@/components/ui/Responsive";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar, type FilterFacet } from "@/components/ui/FilterBar";
import { RowMenu, type RowAction } from "@/components/ui/RowMenu";

function RoleBadge({ e }: { e: Employee }) {
  return e.role === "ADMIN"
    ? <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white">ADMIN</span>
    : <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">USER</span>;
}

function LineDot({ e }: { e: Employee }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${e.lineLinked ? "text-[#06C755]" : "text-slate-400"}`}>
      <MessageCircle size={14} /> {e.lineLinked ? "ผูกแล้ว" : "ยังไม่ผูก"}
    </span>
  );
}

function EmployeeForm({ e }: { e?: Employee | null }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="รหัสพนักงาน"><Input defaultValue={e?.id} placeholder="EMP007" disabled={!!e} /></Field>
      <Field label="ชื่อ-สกุล"><Input defaultValue={e?.name} placeholder="ชื่อ นามสกุล" /></Field>
      <Field label="Username"><Input defaultValue={e?.username} placeholder="username" /></Field>
      <Field label="Email"><Input type="email" defaultValue={e?.email} placeholder="name@company.co.th" /></Field>
      <Field label="แผนก"><Input defaultValue={e?.department} placeholder="ฝ่ายขาย" /></Field>
      <Field label="ตำแหน่ง"><Input defaultValue={e?.position} placeholder="เจ้าหน้าที่" /></Field>
      <Field label="หัวหน้าผู้อนุมัติ"><Select>{EMPLOYEES.filter((x) => x.role === "ADMIN").map((x) => <option key={x.id}>{x.name}</option>)}</Select></Field>
      <Field label="Role"><Select defaultValue={e?.role}><option>USER</option><option>ADMIN</option></Select></Field>
      {!e && <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800 sm:col-span-2">ระบบจะสร้างรหัสผ่านชั่วคราว และบังคับให้เปลี่ยนเมื่อเข้าสู่ระบบครั้งแรก</p>}
    </div>
  );
}

const opt = (v: string, label = v) => ({ value: v, label });

export default function EmployeesPage() {
  const [people, setPeople] = useState(EMPLOYEES);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string[]>([]);
  const [role, setRole] = useState<string[]>([]);
  const [line, setLine] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [form, setForm] = useState<{ e: Employee | null } | null>(null);
  const [reset, setReset] = useState<Employee | null>(null);

  const facets: FilterFacet[] = [
    { id: "dept", label: "แผนก", options: [...new Set(people.map((e) => e.department))].map((d) => opt(d)), selected: dept, onChange: setDept },
    { id: "role", label: "Role", options: [opt("ADMIN"), opt("USER")], selected: role, onChange: setRole },
    { id: "line", label: "LINE", options: [opt("yes", "ผูกแล้ว"), opt("no", "ยังไม่ผูก")], selected: line, onChange: setLine },
    { id: "status", label: "สถานะ", options: [opt("active", "ใช้งาน"), opt("inactive", "ปิดใช้งาน")], selected: status, onChange: setStatus },
  ];
  const list = people.filter((e) =>
    (!dept.length || dept.includes(e.department)) &&
    (!role.length || role.includes(e.role)) &&
    (!line.length || line.includes(e.lineLinked ? "yes" : "no")) &&
    (!status.length || status.includes(e.active ? "active" : "inactive")) &&
    (e.name + e.username + e.email + e.id).toLowerCase().includes(q.toLowerCase()));

  const actions = (e: Employee): RowAction[] => [
    { label: "แก้ไขข้อมูล", icon: Pencil, onClick: () => setForm({ e }) },
    { label: "รีเซ็ตรหัสผ่าน", icon: KeyRound, onClick: () => setReset(e) },
    { label: e.active ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: Power, danger: e.active, onClick: () => setPeople((l) => l.map((x) => (x.id === e.id ? { ...x, active: !x.active } : x))) },
  ];

  const bar = (
    <FilterBar searchValue={q} onSearchChange={setQ} searchPlaceholder="ค้นหา ชื่อ / username / email / รหัส" facets={facets}
      totalItems={list.length} itemNoun="คน" summary={<>ใช้งาน <b className="text-slate-900">{list.filter((e) => e.active).length}</b> · ผูก LINE <b className="text-slate-900">{list.filter((e) => e.lineLinked).length}</b></>} />
  );

  const dialogs = (variant: "sheet" | "modal") => (
    <>
      <Dialog variant={variant} open={!!form} onClose={() => setForm(null)} title={form?.e ? `แก้ไข ${form.e.name}` : "เพิ่มพนักงาน"}
        footer={<div className="flex justify-end gap-2"><button onClick={() => setForm(null)} className="h-10 rounded-xl border border-slate-200 px-4 font-bold text-slate-600">ยกเลิก</button><button onClick={() => setForm(null)} className="h-10 rounded-xl bg-blue-600 px-5 font-bold text-white">บันทึก</button></div>}>
        {form && <EmployeeForm e={form.e} />}
      </Dialog>
      <Dialog variant={variant} open={!!reset} onClose={() => setReset(null)} title="รีเซ็ตรหัสผ่าน"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setReset(null)} className="h-10 rounded-xl border border-slate-200 px-4 font-bold text-slate-600">ยกเลิก</button><button onClick={() => setReset(null)} className="h-10 rounded-xl bg-slate-900 px-5 font-bold text-white">ยืนยันรีเซ็ต</button></div>}>
        {reset && <p className="text-slate-600">สร้างรหัสผ่านชั่วคราวใหม่ให้ <b>{reset.name}</b> ({reset.email}) และบังคับเปลี่ยนเมื่อเข้าสู่ระบบครั้งถัดไป</p>}
      </Dialog>
    </>
  );

  return (
    <>
      <MobileView>
        <div className="space-y-3">
          {bar}
          <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
            {list.map((e) => (
              <li key={e.id} className={`flex items-center gap-3 px-3.5 py-3 ${e.active ? "" : "opacity-50"}`}>
                <UserRound size={20} className="shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-bold">{e.name} <RoleBadge e={e} /></p>
                  <p className="truncate text-xs text-slate-500">{e.department} · {e.email}</p>
                  <LineDot e={e} />
                </div>
                <RowMenu actions={actions(e)} label={`คำสั่งของ ${e.name}`} />
              </li>
            ))}
          </ul>
          <button onClick={() => setForm({ e: null })} className="fixed bottom-24 right-4 z-20 grid size-14 place-items-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30" aria-label="เพิ่มพนักงาน"><Plus size={26} /></button>
        </div>
        {dialogs("sheet")}
      </MobileView>

      <DesktopView>
        <div className="space-y-5">
          <PageHeader title="พนักงาน" subtitle="บัญชีผู้ใช้ สิทธิ์ และการผูก LINE"
            actions={<>
              <button className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50"><FileUp size={18} /> Import Excel</button>
              <button onClick={() => setForm({ e: null })} className="flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20"><Plus size={18} /> เพิ่มพนักงาน</button>
            </>} />
          {bar}
          <DataTable rows={list} rowKey={(e) => e.id} minWidth={880} empty="ไม่พบพนักงาน" onRowClick={(e) => setForm({ e })}
            columns={[
              { key: "name", header: "พนักงาน", sort: (e) => e.name, cell: (e) => <div className={e.active ? "" : "opacity-50"}><p className="font-bold">{e.name}</p><p className="text-xs text-slate-400">{e.id}</p></div> },
              { key: "user", header: "Username / Email", sort: (e) => e.username, cell: (e) => <>{e.username}<div className="text-xs text-slate-400">{e.email}</div></> },
              { key: "dept", header: "แผนก / ตำแหน่ง", sort: (e) => e.department, cell: (e) => <>{e.department}<div className="text-xs text-slate-400">{e.position}</div></> },
              { key: "role", header: "Role", sort: (e) => e.role, cell: (e) => <RoleBadge e={e} /> },
              { key: "line", header: "LINE", sort: (e) => (e.lineLinked ? 0 : 1), cell: (e) => <LineDot e={e} /> },
              { key: "status", header: "สถานะ", sort: (e) => (e.active ? 0 : 1), cell: (e) => (e.active ? <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600"><span className="size-2 rounded-full bg-emerald-500" />ใช้งาน</span> : <span className="inline-flex items-center gap-1.5 text-slate-400"><span className="size-2 rounded-full bg-slate-300" />ปิดใช้งาน</span>) },
              { key: "act", header: "", align: "right", className: "w-14", cell: (e) => <RowMenu actions={actions(e)} label={`คำสั่งของ ${e.name}`} /> },
            ]} />
        </div>
        {dialogs("modal")}
      </DesktopView>
    </>
  );
}
