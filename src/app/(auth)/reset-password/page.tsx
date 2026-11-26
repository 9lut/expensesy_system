"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { AuthCard, PasswordInput, PasswordRules, passwordOk, postJson } from "@/components/ui/AuthCard";

/** /reset-password?id=EMP001&token=... — มาจากลิงก์ในอีเมล */
export default function ResetPasswordPage() {
  return <Suspense><ResetPassword /></Suspense>;
}

function ResetPassword() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const token = params.get("token") ?? "";
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(id && token ? "" : "ลิงก์ไม่ครบ กรุณาเปิดจากอีเมลอีกครั้ง");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await postJson("/api/auth/reset", { id, token, password: pw });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ตั้งรหัสผ่านไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <AuthCard title="ตั้งรหัสผ่านใหม่แล้ว">
        <div className="space-y-4 text-center">
          <CheckCircle2 size={56} className="mx-auto text-emerald-600" />
          <p className="text-slate-600">ใช้รหัสผ่านใหม่เข้าสู่ระบบได้เลย</p>
          <Link href="/login" className="block rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-600/25">ไปหน้าเข้าสู่ระบบ</Link>
        </div>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="ตั้งรหัสผ่านใหม่">
      <form onSubmit={submit} className="space-y-4">
        <Field label="รหัสผ่านใหม่"><PasswordInput value={pw} onChange={setPw} autoComplete="new-password" /></Field>
        <Field label="ยืนยันรหัสผ่านใหม่"><PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" /></Field>
        <PasswordRules pw={pw} confirm={confirm} />
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
        <button disabled={busy || !id || !token || !passwordOk(pw, confirm)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-600/25 disabled:opacity-40">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />} บันทึกรหัสผ่านใหม่
        </button>
      </form>
      <Link href="/forgot-password" className="block text-center text-sm font-bold text-blue-600">ขอลิงก์ใหม่</Link>
    </AuthCard>
  );
}
