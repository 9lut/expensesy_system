"use client";

import { useState } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";

export type RowAction = { label: string; icon: LucideIcon; onClick: () => void; danger?: boolean };

/** ปุ่ม "…" ท้ายแถว → เมนูคำสั่ง (แก้ไข / ปิดใช้งาน / ลบ ฯลฯ) */
export function RowMenu({ actions, label = "คำสั่ง" }: { actions: RowAction[]; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block text-left">
      <button type="button" onClick={() => setOpen(!open)} aria-label={label} aria-expanded={open}
        className={`grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 ${open ? "bg-slate-100 text-slate-800" : ""}`}>
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <>
          <button type="button" aria-label="ปิดเมนู" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 top-[calc(100%+4px)] z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
            {actions.map((a, i) => (
              <button key={a.label} type="button" role="menuitem" onClick={() => { setOpen(false); a.onClick(); }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold ${
                  a.danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50"} ${a.danger && i > 0 ? "border-t border-slate-100" : ""}`}>
                <a.icon size={16} className={a.danger ? "" : "text-slate-400"} /> {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
