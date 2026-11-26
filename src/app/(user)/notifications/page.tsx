import Link from "next/link";
import { BadgeCheck, Banknote, Clock, Undo2, Wallet, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

// Phase 1: ข้อมูลจำลอง — Phase 5 มาจากประวัติสถานะ + การแจ้งเตือน LINE
const ITEMS: { icon: LucideIcon; tone: string; title: string; body: string; at: string; href: string; unread?: boolean }[] = [
  { icon: Undo2, tone: "text-violet-600", title: "ใบเบิกถูกส่งกลับให้แก้ไข", body: "ค่าอาหารประชุมทีม — ใบเสร็จไม่ชัด กรุณาถ่ายใหม่", at: "13 พ.ย. 69", href: "/expenses/EXP-6911-0010", unread: true },
  { icon: Wallet, tone: "text-amber-600", title: "เงินยืมใกล้ครบกำหนดเคลียร์", body: "ยืมเงินล่วงหน้า งานสัมมนา ฿8,000.00 — เหลือ 3 วัน", at: "25 พ.ย. 69", href: "/advances", unread: true },
  { icon: Banknote, tone: "text-blue-600", title: "ใบเบิกพร้อมจ่าย", body: "ซื้อวัสดุสำนักงาน ฿1,290.00 — ฝ่ายบัญชีตรวจเอกสารครบแล้ว", at: "17 พ.ย. 69", href: "/expenses/EXP-6911-0011" },
  { icon: Clock, tone: "text-slate-500", title: "ส่งใบเบิกแล้ว รออนุมัติ", body: "เดินทางพบลูกค้า เชียงใหม่ ฿4,850.00", at: "20 พ.ย. 69", href: "/expenses/EXP-6911-0012" },
  { icon: BadgeCheck, tone: "text-emerald-600", title: "จ่ายเงินแล้ว", body: "ยืมเงินล่วงหน้า งานสัมมนา ฿8,000.00 · โอนเข้าบัญชี", at: "7 พ.ย. 69", href: "/expenses/ADV-6911-0003" },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <div className="hidden md:block"><PageHeader title="การแจ้งเตือน" subtitle={`ยังไม่อ่าน ${ITEMS.filter((i) => i.unread).length} รายการ · ส่งทาง LINE ด้วยเมื่อผูกบัญชีแล้ว`} /></div>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
        {ITEMS.map((n) => (
          <li key={n.title}>
            <Link href={n.href} className={`flex gap-3 px-4 py-3.5 hover:bg-slate-50 ${n.unread ? "bg-blue-50/40" : ""}`}>
              <n.icon size={20} className={`mt-0.5 shrink-0 ${n.tone}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-bold">{n.title}</p>
                  <span className="shrink-0 text-xs text-slate-400">{n.at}</span>
                </div>
                <p className="truncate text-sm text-slate-500">{n.body}</p>
              </div>
              {n.unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-blue-600" aria-label="ยังไม่อ่าน" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
