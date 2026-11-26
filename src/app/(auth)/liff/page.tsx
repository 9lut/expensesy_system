"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FlaskConical, Link2, Loader2, MessageCircle, RotateCw, UserRound } from "lucide-react";
import { BrandMark } from "@/components/ui/Brand";
import { Field, Input } from "@/components/ui/Field";
import { PasswordInput, postJson } from "@/components/ui/AuthCard";
import type { Employee } from "@/lib/types";

type Step = "checking" | "dev" | "link" | "done" | "error";
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID;

/**
 * หน้าเข้าระบบใน LINE (LIFF) — แผนข้อ 5.3
 * liff.init → ID Token → /api/auth/line → ผูกแล้วเข้าเลย / ยังไม่ผูก → ฟอร์มผูกบัญชีครั้งเดียว
 * ยังไม่ได้ตั้ง NEXT_PUBLIC_LIFF_ID (เครื่อง dev) → โหมดทดสอบ ใช้ LINE userId จำลอง
 */
export default function LiffEntry() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(LIFF_ID ? "checking" : "dev");
  const [idToken, setIdToken] = useState("");
  const [lineName, setLineName] = useState("");
  const [picture, setPicture] = useState<string>();
  const [login, setLogin] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<{ employee: Employee; next: string }>();
  const [devUser, setDevUser] = useState("Udev-demo");

  /** ส่ง ID Token ให้เซิร์ฟเวอร์ตรวจกับ LINE */
  const check = useCallback(async (token: string) => {
    setStep("checking");
    setIdToken(token);
    try {
      const r = await postJson<{ status: "ok"; next: string } | { status: "need_link"; lineName: string; picture?: string }>("/api/auth/line", { idToken: token });
      if (r.status === "ok") { router.replace(r.next); router.refresh(); return; }
      setLineName(r.lineName);
      setPicture(r.picture);
      setStep("link");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ตรวจสอบบัญชี LINE ไม่สำเร็จ");
      setStep("error");
    }
  }, [router]);

  const start = useCallback(async () => {
    if (!LIFF_ID) return;
    setStep("checking");
    try {
      const liff = (await import("@line/liff")).default;
      await liff.init({ liffId: LIFF_ID });
      if (!liff.isLoggedIn()) { liff.login({ redirectUri: window.location.href }); return; }
      const token = liff.getIDToken();
      if (!token) throw new Error("ไม่ได้รับ ID Token จาก LINE — ตรวจว่า LIFF app เปิด scope openid");
      await check(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เปิด LINE ไม่สำเร็จ");
      setStep("error");
    }
  }, [check]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- เริ่ม LIFF ครั้งเดียวตอนเปิดหน้า
  useEffect(() => { void start(); }, [start]);

  const link = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await postJson<{ employee: Employee; next: string }>("/api/auth/line/link", { idToken, login, password: pw });
      setMe(r);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ผูกบัญชีไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-gradient-to-b from-blue-50 to-white px-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandMark size={56} />
        <h1 className="text-xl font-bold">ระบบเบิกค่าใช้จ่าย</h1>
      </div>

      {step === "checking" && (
        <div className="grid flex-1 place-items-center text-slate-500">
          <div className="flex flex-col items-center gap-3"><Loader2 className="animate-spin text-blue-600" size={36} /> กำลังตรวจสอบบัญชี LINE…</div>
        </div>
      )}

      {step === "dev" && (
        <form onSubmit={(e) => { e.preventDefault(); void check(`dev:${devUser.trim()}:LINE ทดสอบ`); }} className="mt-8 space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="flex items-center gap-2 font-bold text-amber-800"><FlaskConical size={18} /> โหมดทดสอบ (ยังไม่ได้ตั้ง LIFF ID)</p>
          <p className="text-sm text-amber-800">จำลองการเปิดจาก LINE ด้วย LINE userId ด้านล่าง — ใช้ได้เฉพาะเครื่อง dev</p>
          <Field label="LINE userId (จำลอง)"><Input value={devUser} onChange={(e) => setDevUser(e.target.value)} /></Field>
          <button disabled={!devUser.trim()} className="w-full rounded-2xl bg-[#06C755] py-3.5 font-bold text-white disabled:opacity-40">เปิดเหมือนมาจาก LINE</button>
        </form>
      )}

      {step === "error" && (
        <div className="grid flex-1 place-items-center text-center">
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle size={48} className="text-amber-500" />
            <p className="font-bold text-slate-800">{error}</p>
            <button onClick={() => (LIFF_ID ? void start() : setStep("dev"))} className="mt-2 flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-3.5 font-bold text-white">
              <RotateCw size={18} /> ลองใหม่
            </button>
          </div>
        </div>
      )}

      {step === "link" && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {picture
              // eslint-disable-next-line @next/next/no-img-element -- รูปโปรไฟล์ LINE จากโดเมนภายนอก
              ? <img src={picture} alt="" className="size-12 rounded-full object-cover" />
              : <span className="grid size-12 place-items-center rounded-full bg-[#06C755] text-white"><MessageCircle size={24} /></span>}
            <div className="min-w-0">
              <p className="text-sm text-slate-500">เข้าใช้งานด้วย LINE</p>
              <p className="truncate font-bold">{lineName}</p>
            </div>
            <span className="ml-auto rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">ยังไม่ผูก</span>
          </div>

          <div>
            <h2 className="text-lg font-bold">ผูกบัญชีครั้งแรก</h2>
            <p className="text-sm text-slate-500">กรอกบัญชีที่ได้รับจากบริษัท ทำครั้งเดียว ครั้งต่อไปเข้าระบบอัตโนมัติ</p>
          </div>

          <form onSubmit={link} className="space-y-4">
            <Field label="Username หรือ Email">
              <Input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" placeholder="somchai@company.co.th" />
            </Field>
            <Field label="รหัสผ่าน"><PasswordInput value={pw} onChange={setPw} autoComplete="current-password" /></Field>
            {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
            <button disabled={!login || !pw || busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-blue-600/25 disabled:opacity-40">
              {busy ? <Loader2 size={20} className="animate-spin" /> : <Link2 size={20} />} ผูกบัญชีและเข้าสู่ระบบ
            </button>
          </form>
        </div>
      )}

      {step === "done" && me && (
        <div className="grid flex-1 place-items-center text-center">
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 size={64} className="text-emerald-600" />
            <h2 className="text-xl font-bold">ผูกบัญชีสำเร็จ</h2>
            <p className="flex items-center gap-1.5 text-slate-500"><UserRound size={16} /> {me.employee.name} · {me.employee.department}</p>
            <button onClick={() => { router.replace(me.next); router.refresh(); }} className="mt-4 w-full rounded-2xl bg-blue-600 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-blue-600/25">
              เริ่มใช้งาน
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
