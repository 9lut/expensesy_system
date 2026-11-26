import type { LucideIcon } from "lucide-react";

type Tone = "default" | "accent" | "success" | "danger" | "warning";

/**
 * การ์ดตัวเลข — โทนเรียบ (ตัวเลขสีเข้ม ไอคอนเทาไม่มีพื้นหลัง)
 * ใช้สีเฉพาะ danger (เช่น เกินกำหนด) เพื่อให้สะดุดตาเมื่อจำเป็นจริง ๆ
 * สูงเต็มช่องของ grid และจัดเนื้อหากึ่งกลางแนวตั้ง
 */
export function StatCard({ label, value, hint, tone = "default", icon: Icon }: {
  label: string; value: string; hint?: string; tone?: Tone; icon?: LucideIcon;
}) {
  const danger = tone === "danger";
  return (
    <div className="flex h-full min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate text-xs font-bold text-slate-500">
          {Icon && <Icon size={15} className={`shrink-0 ${danger ? "text-rose-500" : "text-slate-400"}`} />}
          {label}
        </div>
        <div className={`mt-1.5 truncate text-[1.6rem] font-bold leading-tight tabular-nums ${danger ? "text-rose-600" : "text-slate-900"}`}>{value}</div>
        {hint && <div className="mt-1 truncate text-xs text-slate-400">{hint}</div>}
      </div>
    </div>
  );
}
