"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { baht } from "@/lib/meta";

export type Step<K extends string> = { key: K; icon: LucideIcon; title: string; hint: string; count: number; amount: number; tone: string };

/**
 * แถบขั้นตอนงานการเงิน: แต่ละขั้นเป็นการ์ดที่กดเลือกได้ เห็นจำนวนและยอดเงินทันที
 * คอม = เรียงแนวนอนมีลูกศรต่อกัน · มือถือ = เลื่อนแนวนอน
 */
export function StepTabs<K extends string>({ steps, value, onChange, sequential = true }: {
  steps: Step<K>[]; value: K; onChange: (k: K) => void;
  /** false = เป็นแค่กลุ่ม ไม่ใช่ขั้นตอนต่อกัน (ไม่แสดง "ขั้นที่" และลูกศร) */
  sequential?: boolean;
}) {
  return (
    // ring-inset + py-1: กรอบของแท็บที่เลือกไม่ถูกตัดขอบโดยกล่องเลื่อนแนวนอน
    <div className="no-scrollbar -mx-4 flex snap-x items-stretch gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:overflow-visible md:px-0 md:py-0">
      {steps.map((s, i) => {
        const on = s.key === value;
        return (
          <div key={s.key} className="flex shrink-0 snap-start items-center gap-2 md:flex-1 md:shrink">
            <button onClick={() => onChange(s.key)} aria-pressed={on}
              className={`flex w-60 items-center gap-3 rounded-2xl p-4 text-left ring-inset transition md:w-full ${on ? "bg-white shadow-sm ring-2 ring-blue-600" : "bg-white/70 ring-1 ring-slate-200 hover:bg-white"}`}>
              <s.icon size={22} className={`shrink-0 ${on ? "text-blue-600" : "text-slate-400"}`} />
              <span className="min-w-0 flex-1">
                {sequential && <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">ขั้นที่ {i + 1}</span>}
                <span className="block font-bold">{s.title}</span>
                <span className="block truncate text-xs text-slate-500">{s.hint}</span>
              </span>
              <span className="text-right">
                <span className="block text-2xl font-bold tabular-nums">{s.count}</span>
                <span className="block whitespace-nowrap text-xs text-slate-500 tabular-nums">{baht(s.amount)}</span>
              </span>
            </button>
            {sequential && i < steps.length - 1 && <ChevronRight className="hidden shrink-0 text-slate-300 md:block" />}
          </div>
        );
      })}
    </div>
  );
}
