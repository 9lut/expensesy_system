"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";
import { BrandLogo } from "@/components/ui/Brand";
import { Field, Input } from "@/components/ui/Field";

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}

/** ปลายทางหลัง Login ต้องเป็น path ภายในเว็บเท่านั้น (กัน open redirect) */
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : null);

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(params.get("error") ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !pw) return setError("กรุณากรอก Username / Email และรหัสผ่าน");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ login: id, password: pw }) });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error);
      const next = safeNext(params.get("next"));
      router.replace(j.data.mustChange ? "/change-password" : next && j.data.employee.role !== "ADMIN" ? next : j.data.next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh bg-white">
      {/* คอม: แผงแบรนด์ด้านซ้าย */}
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-violet-600 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative"><BrandLogo height={48} white /></div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight">เบิกค่าใช้จ่าย<br />ง่าย ไว ตรวจสอบได้</h1>
          <ul className="space-y-4 text-white/90">
            {[
              [Smartphone, "กรอกใบเบิกผ่าน LINE บนมือถือ ถ่ายรูปใบเสร็จได้ทันที"],
              [ShieldCheck, "อนุมัติ ตรวจเอกสาร และจ่ายเงิน ครบในระบบเดียว"],
              [MessageCircle, "แจ้งเตือนทุกสถานะผ่าน LINE OA"],
            ].map(([Icon, text], i) => {
              const I = Icon as typeof Smartphone;
              return (
                <li key={i} className="flex items-center gap-3">
                  <I size={20} className="shrink-0 text-white/80" />
                  {text as string}
                </li>
              );
            })}
          </ul>
        </div>
        <p className="relative text-sm text-white/70">© 2569 บริษัท ตัวอย่าง จำกัด</p>
      </aside>

      {/* ฟอร์ม (มือถือ = ทั้งจอ) */}
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-3 text-center lg:text-left">
            <div className="mb-2 flex justify-center lg:hidden"><BrandLogo stacked height={128} /></div>
            <h2 className="text-2xl font-bold">เข้าสู่ระบบ</h2>
            <p className="text-slate-500">ระบบเบิกค่าใช้จ่ายพนักงาน</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Field label="Username หรือ Email">
              <Input autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} placeholder="somchai หรือ somchai@company.co.th" />
            </Field>
            <Field label="รหัสผ่าน">
              <div className="relative">
                <Input type={show ? "text" : "password"} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" className="pr-11" />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-700">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            <div className="flex justify-end text-sm">
              <Link href="/forgot-password" className="font-bold text-blue-600">ลืมรหัสผ่าน?</Link>
            </div>
            {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[.98] disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />} {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> หรือ <span className="h-px flex-1 bg-slate-200" />
          </div>
          {/* มือถือ → LIFF · คอม → LINE Login บนเว็บ */}
          <Link href="/liff" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3.5 font-bold text-white transition hover:brightness-95 md:hidden">
            <MessageCircle size={18} /> เข้าสู่ระบบด้วย LINE
          </Link>
          <a href="/api/auth/line/start?mode=login" className="hidden w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3.5 font-bold text-white transition hover:brightness-95 md:flex">
            <MessageCircle size={18} /> เข้าสู่ระบบด้วย LINE
          </a>
          <p className="text-center text-xs text-slate-500">
            ใช้ได้เมื่อผูกบัญชี LINE แล้ว · ยังไม่มีบัญชี? ติดต่อฝ่ายบุคคล / แอดมิน
          </p>
        </div>
      </main>
    </div>
  );
}
