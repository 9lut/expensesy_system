"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { BrandMark } from "./Brand";
import { inputCls } from "./Field";

/** การ์ดกลางจอสำหรับหน้า Login ย่อย (ลืมรหัส / ตั้งรหัสใหม่ / เปลี่ยนรหัสครั้งแรก) */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-sm space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark size={48} />
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

/** ช่องรหัสผ่าน + ปุ่มแสดง/ซ่อน */
export function PasswordInput({ value, onChange, autoComplete, placeholder = "••••••••" }: {
  value: string; onChange: (v: string) => void; autoComplete: "current-password" | "new-password"; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} placeholder={placeholder} className={`${inputCls} pr-11`} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-700">
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

/** ตรวจเงื่อนไขรหัสผ่านแบบเห็นทันที (ตรงกับฝั่งเซิร์ฟเวอร์) */
export function PasswordRules({ pw, confirm }: { pw: string; confirm: string }) {
  const rules = [
    { ok: pw.length >= 8, text: "อย่างน้อย 8 ตัวอักษร" },
    { ok: /[A-Za-z฀-๿]/.test(pw) && /\d/.test(pw), text: "มีทั้งตัวอักษรและตัวเลข" },
    { ok: !!pw && pw === confirm, text: "ยืนยันรหัสผ่านตรงกัน" },
  ];
  return (
    <ul className="space-y-1 text-sm">
      {rules.map((r) => (
        <li key={r.text} className={`flex items-center gap-2 ${r.ok ? "text-emerald-600" : "text-slate-400"}`}>
          <span className={`grid size-4 place-items-center rounded-full text-[10px] font-bold text-white ${r.ok ? "bg-emerald-500" : "bg-slate-300"}`}>✓</span> {r.text}
        </li>
      ))}
    </ul>
  );
}

export const passwordOk = (pw: string, confirm: string) => pw.length >= 8 && /[A-Za-z฀-๿]/.test(pw) && /\d/.test(pw) && pw === confirm;

/** ส่ง JSON → { ok, data } หรือโยน Error ข้อความภาษาไทยจากเซิร์ฟเวอร์ */
export async function postJson<T = unknown>(url: string, body: unknown, method = "POST"): Promise<T> {
  const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({ ok: false, error: "เซิร์ฟเวอร์ไม่ตอบ" }));
  if (!j.ok) throw new Error(j.error);
  return j.data as T;
}
