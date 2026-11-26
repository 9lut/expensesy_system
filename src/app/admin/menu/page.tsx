import Link from "next/link";
import { ChevronRight, FileSpreadsheet, FileText, FolderCog, LogOut, Repeat, Settings, Users } from "lucide-react";
import { requireUser } from "@/server/session";

// มือถือ: แท็บ "เมนู" รวมหน้าที่ไม่อยู่ในแท็บล่าง (คอมใช้ Sidebar แทน)
const GROUPS = [
  { title: "จัดการข้อมูล", links: [
    { href: "/admin/expenses", label: "ใบเบิกทั้งหมด", icon: FileText },
    { href: "/admin/reports", label: "รายงานบัญชี", icon: FileSpreadsheet },
    { href: "/admin/employees", label: "พนักงาน", icon: Users },
    { href: "/admin/categories", label: "หมวดค่าใช้จ่าย", icon: FolderCog },
    { href: "/admin/settings", label: "ตั้งค่าระบบ", icon: Settings },
  ] },
  { title: "อื่น ๆ", links: [{ href: "/select-view", label: "เปลี่ยนมุมมอง", icon: Repeat }] },
];

export default async function AdminMenu() {
  const CURRENT_ADMIN = await requireUser({ admin: true });
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
        <p className="font-bold">{CURRENT_ADMIN.name}</p>
        <p className="text-sm text-slate-500">{CURRENT_ADMIN.position} · แอดมิน</p>
      </div>
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2 className="mb-2 px-1 text-sm font-bold text-slate-500">{g.title}</h2>
          <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
            {g.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex items-center gap-3 px-4 py-4 active:bg-slate-50">
                  <span className="grid shrink-0 place-items-center text-slate-500"><l.icon size={18} /></span>
                  <span className="font-semibold">{l.label}</span>
                  <ChevronRight size={18} className="ml-auto text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <form action="/api/auth/logout" method="post">
            <button className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-bold text-rose-600 shadow-sm ring-1 ring-slate-200/70 w-full">
              <LogOut size={18} /> ออกจากระบบ
            </button>
          </form>
    </div>
  );
}
