"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, LogOut } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { AuthCard, PasswordInput, PasswordRules, passwordOk, postJson } from "@/components/ui/AuthCard";

/** บังคับเปลี่ยนรหัสผ่านครั้งแรก (บัญชีที่แอดมินสร้าง / รีเซ็ตให้) — proxy พามาหน้านี้จนกว่าจะเปลี่ยน */
export default function ChangePassword() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await postJson<{ next: string }>("/api/auth/password", { current, next: pw });
      router.replace(r.next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      setBusy(false);
    }
  };

  return (
    <AuthCard title="ตั้งรหัสผ่านใหม่" subtitle="บัญชีนี้ใช้รหัสผ่านชั่วคราว กรุณาตั้งรหัสผ่านของคุณเองก่อนเริ่มใช้งาน">
      <form onSubmit={submit} className="space-y-4">
        <Field label="รหัสผ่านชั่วคราว / ปัจจุบัน"><PasswordInput value={current} onChange={setCurrent} autoComplete="current-password" /></Field>
        <Field label="รหัสผ่านใหม่"><PasswordInput value={pw} onChange={setPw} autoComplete="new-password" /></Field>
        <Field label="ยืนยันรหัสผ่านใหม่"><PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" /></Field>
        <PasswordRules pw={pw} confirm={confirm} />
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
        <button disabled={busy || !current || !passwordOk(pw, confirm)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-600/25 disabled:opacity-40">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />} บันทึกและเริ่มใช้งาน
        </button>
      </form>
      <form action="/api/auth/logout" method="post">
        <button className="flex w-full items-center justify-center gap-1.5 text-sm font-bold text-slate-500 hover:text-rose-600"><LogOut size={15} /> ออกจากระบบ</button>
      </form>
    </AuthCard>
  );
}
