"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * sheet = Bottom Sheet (มือถือ) · modal = กลางจอ (คอม)
 * เลือกตามมุมมองที่เรียกใช้ ไม่ต้องตรวจขนาดจอเอง
 */
export function Dialog({ open, onClose, title, variant, children, footer, wide = false }: {
  open: boolean; onClose: () => void; title: string; variant: "sheet" | "modal"; children: ReactNode; footer?: ReactNode;
  /** modal กว้าง (เช่น ตรวจใบเสร็จ: รูป + ฟิลด์ 2 คอลัมน์) */
  wide?: boolean;
}) {
  if (!open) return null;
  const sheet = variant === "sheet";
  return (
    <div className={`fixed inset-0 z-50 flex ${sheet ? "items-end" : "items-center justify-center p-6"}`} role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="ปิด" onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className={`relative flex max-h-[90dvh] w-full flex-col bg-white shadow-2xl ${sheet ? "rounded-t-3xl pb-[env(safe-area-inset-bottom)]" : `${wide ? "max-w-5xl" : "max-w-lg"} rounded-2xl`}`}>
        {sheet && <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-200" />}
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="ปิด" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="border-t border-slate-100 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
