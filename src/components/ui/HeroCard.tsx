import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** การ์ดตัวเลขสำคัญที่สุดของหน้า — Gradient สีแบรนด์ (จุดเดียวที่ใช้สีเต็มบนหน้า) */
export function HeroCard({ label, value, hint, icon: Icon, children }: {
  label: string; value: string; hint?: ReactNode; icon?: LucideIcon; children?: ReactNode;
}) {
  return (
    <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-600 to-violet-600 p-5 text-white shadow-lg shadow-blue-600/20">
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -bottom-16 right-16 size-40 rounded-full bg-violet-300/20 blur-2xl" />
      <div className="relative flex h-full flex-col justify-center">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-white/80">
          {Icon && <Icon size={16} className="shrink-0" />}
          {label}
        </p>
        <p className="mt-1 truncate text-3xl font-bold tabular-nums md:text-[2.1rem] md:leading-tight">{value}</p>
        {hint && <p className="mt-1 text-sm text-white/80">{hint}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}
