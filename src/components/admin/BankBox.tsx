"use client";

import { useState } from "react";
import { Check, Copy, Landmark } from "lucide-react";
import { BANK_ACCOUNTS } from "@/lib/mock";

/** บัญชีรับเงินของพนักงาน + ปุ่มคัดลอกเลขบัญชี (ใช้ตอนโอนเงิน) */
export function BankBox({ employeeId, compact = false }: { employeeId: string; compact?: boolean }) {
  const acc = BANK_ACCOUNTS[employeeId];
  const [copied, setCopied] = useState(false);
  if (!acc) return <span className="text-xs text-rose-600">ยังไม่มีบัญชีรับเงิน</span>;

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(acc.no.replaceAll("-", "")); } catch { /* ไม่รองรับ clipboard */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span><span className="font-semibold">{acc.bank}</span> <span className="tabular-nums text-slate-600">{acc.no}</span></span>
        <button onClick={copy} aria-label="คัดลอกเลขบัญชี" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600">
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
        </button>
      </span>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <span className="grid size-10 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200"><Landmark size={20} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">โอนเข้าบัญชี {acc.bank}</p>
        <p className="text-lg font-bold tabular-nums">{acc.no}</p>
        <p className="text-xs text-slate-500">{acc.name}</p>
      </div>
      <button onClick={copy} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold ${copied ? "bg-emerald-600 text-white" : "bg-white text-blue-600 ring-1 ring-slate-200"}`}>
        {copied ? <><Check size={16} /> คัดลอกแล้ว</> : <><Copy size={16} /> คัดลอก</>}
      </button>
    </div>
  );
}
