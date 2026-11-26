"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck, Send } from "lucide-react";
import { Field, Input } from "@/components/ui/Field";
import { AuthCard, postJson } from "@/components/ui/AuthCard";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await postJson<{ devLink?: string }>("/api/auth/forgot", { email });
      setDevLink(r.devLink);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="ลืมรหัสผ่าน">
      {sent ? (
        <div className="space-y-3 text-center">
          <MailCheck size={48} className="mx-auto text-emerald-600" />
          <p className="text-slate-600">ถ้ามีบัญชีของ <b>{email}</b> ระบบได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว (หมดอายุใน 30 นาที)</p>
          {devLink && (
            <p className="rounded-xl bg-amber-50 p-3 text-left text-xs text-amber-800 ring-1 ring-amber-200">
              โหมดทดสอบ (ไม่มีอีเมลจริง): <a href={devLink} className="font-bold underline">เปิดลิงก์ตั้งรหัสใหม่</a>
            </p>
          )}
          <p className="text-sm text-slate-500">ไม่ได้รับอีเมล? ตรวจโฟลเดอร์สแปม หรือให้แอดมินรีเซ็ตรหัสผ่านให้</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-slate-500">กรอกอีเมลที่ใช้กับระบบ เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้</p>
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="somchai@company.co.th" autoComplete="email" />
          </Field>
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
          <button disabled={busy || !email} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-600/25 disabled:opacity-40">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} ส่งลิงก์ตั้งรหัสใหม่
          </button>
        </form>
      )}
      <Link href="/login" className="flex items-center justify-center gap-1 text-sm font-bold text-blue-600">
        <ArrowLeft size={16} /> กลับไปหน้าเข้าสู่ระบบ
      </Link>
    </AuthCard>
  );
}
