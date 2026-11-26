import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/** หัวหน้าทุกหน้า: การ์ดขาว ขอบเทา มุม 2xl เหมือนระบบ ikuwah */
export function PageHeader({ title, subtitle, actions, className = "" }: Props) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-xs md:px-6 md:py-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="line-clamp-1 text-base font-bold leading-snug tracking-tight text-slate-900 md:text-lg">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-xs uppercase tracking-widest text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
