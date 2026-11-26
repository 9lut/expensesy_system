"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, AtSign, BadgeCheck, Building2, CheckCircle2, ChevronRight, FileText, KeyRound, Landmark, Loader2, LogOut, Mail, MessageCircle, UserRound,
} from "lucide-react";
import type { Employee } from "@/lib/types";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { PasswordInput, PasswordRules, passwordOk, postJson } from "@/components/ui/AuthCard";
import { DesktopView, MobileView } from "@/components/ui/Responsive";

/** ซ่อนเลขบัญชี เหลือ 4 ตัวท้าย */
const maskAcc = (no: string) => {
  let keep = 4;
  return no.split("").reverse().map((c) => (/\d/.test(c) ? (keep-- > 0 ? c : "x") : c)).reverse().join("");
};

const NOTIFY = [
  { key: "status", label: "สถานะใบเบิกเปลี่ยน", hint: "อนุมัติ ส่งกลับแก้ไข หรือจ่ายเงินแล้ว — แจ้งทาง LINE" },
  { key: "advance", label: "เตือนเคลียร์เงินยืม", hint: "แจ้งก่อนครบกำหนดเคลียร์ 3 วัน" },
  { key: "email", label: "ส่งสำเนาทางอีเมล", hint: "ส่งสรุปใบเบิกที่จ่ายแล้วไปที่อีเมล" },
] as const;
type NotifyKey = (typeof NOTIFY)[number]["key"];

/** เปลี่ยนรหัสผ่าน (ต้องใส่รหัสปัจจุบัน) */
function PasswordForm({ onDone, big = false }: { onDone: (msg: string) => void; big?: boolean }) {
  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await postJson("/api/auth/password", { current, next: pw });
      onDone("เปลี่ยนรหัสผ่านเรียบร้อย");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="รหัสผ่านปัจจุบัน"><PasswordInput value={current} onChange={setCurrent} autoComplete="current-password" /></Field>
      <Field label="รหัสผ่านใหม่"><PasswordInput value={pw} onChange={setPw} autoComplete="new-password" /></Field>
      <Field label="ยืนยันรหัสผ่านใหม่"><PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" /></Field>
      <PasswordRules pw={pw} confirm={confirm} />
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
      <button disabled={busy || !current || !passwordOk(pw, confirm)}
        className={`flex w-full items-center justify-center gap-2 bg-blue-600 font-bold text-white disabled:opacity-40 ${big ? "rounded-2xl py-4" : "rounded-xl py-3"}`}>
        {busy && <Loader2 size={18} className="animate-spin" />} บันทึกรหัสผ่าน
      </button>
    </form>
  );
}

export interface ProfileStat { label: string; value: string; tone?: string }

export function ProfileView({ u, approverName, stats, bank, flash }: {
  u: Employee;
  approverName: string;
  stats: ProfileStat[];
  bank: { bank: string; no: string; name: string };
  /** ข้อความจาก redirect (เช่น กลับจาก LINE Login) */
  flash?: { tone: "ok" | "error"; text: string };
}) {
  const router = useRouter();
  const [linked, setLinked] = useState(u.lineLinked);
  const [pwOpen, setPwOpen] = useState(false);
  const [notify, setNotify] = useState<Record<NotifyKey, boolean>>({ status: true, advance: true, email: false });
  const [msg, setMsg] = useState(flash);
  const [lineBusy, setLineBusy] = useState(false);
  const BANK = `${bank.bank} · ${maskAcc(bank.no)}`;

  /** ผูก → ไป LINE Login แล้วกลับมา · เลิกผูก → เรียก API */
  const toggleLine = async () => {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- route handler ที่ redirect ไป LINE ต้องโหลดเต็มหน้า
    if (!linked) { window.location.href = "/api/auth/line/start?mode=link"; return; }
    if (!window.confirm("ยกเลิกการผูก LINE? จะเข้าระบบผ่าน LINE และรับแจ้งเตือนไม่ได้จนกว่าจะผูกใหม่")) return;
    setLineBusy(true);
    try {
      await postJson("/api/auth/line/link", {}, "DELETE");
      setLinked(false);
      setMsg({ tone: "ok", text: "ยกเลิกการผูก LINE แล้ว" });
      router.refresh();
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof Error ? e.message : "ยกเลิกการผูกไม่สำเร็จ" });
    } finally {
      setLineBusy(false);
    }
  };
  const pwDone = (text: string) => { setPwOpen(false); setMsg({ tone: "ok", text }); };
  const banner = msg && (
    <p role="status" className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${msg.tone === "ok" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"}`}>
      {msg.tone === "ok" ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />} {msg.text}
    </p>
  );

  const lineBadge = linked
    ? <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">เชื่อมต่อแล้ว</span>
    : <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">ยังไม่ผูก</span>;

  return (
    <>
      {/* ───────── มือถือ: รายการตั้งค่าแบบแอป ───────── */}
      <MobileView>
        <div className="space-y-5">
          {banner}
          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white"><UserRound size={30} /></span>
            <div className="min-w-0">
              <p className="text-lg font-bold">{u.name}</p>
              <p className="text-sm text-slate-500">{u.position} · {u.department}</p>
            </div>
          </div>

          <section>
            <h2 className="mb-2 px-1 text-sm font-bold text-slate-500">บัญชี</h2>
            <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
              {[
                { icon: AtSign, label: "Username", value: u.username },
                { icon: Mail, label: "Email", value: u.email },
                { icon: Landmark, label: "บัญชีรับเงิน", value: BANK },
              ].map((r) => (
                <li key={r.label} className="flex items-center gap-3 px-4 py-3.5">
                  <r.icon size={20} className="text-slate-400" />
                  <span className="text-slate-600">{r.label}</span>
                  <span className="ml-auto truncate pl-2 text-right text-sm font-bold">{r.value}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 px-1 text-sm font-bold text-slate-500">ความปลอดภัย</h2>
            <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
              <li>
                <button onClick={toggleLine} disabled={lineBusy} className="flex w-full items-center gap-3 px-4 py-3.5 active:bg-slate-50">
                  <MessageCircle size={20} className="text-[#06C755]" />
                  <span className="text-slate-600">บัญชี LINE</span>
                  <span className="ml-auto">{lineBadge}</span>
                </button>
              </li>
              <li>
                <button onClick={() => setPwOpen(true)} className="flex w-full items-center gap-3 px-4 py-3.5 active:bg-slate-50">
                  <KeyRound size={20} className="text-slate-400" />
                  <span className="text-slate-600">เปลี่ยนรหัสผ่าน</span>
                  <ChevronRight size={18} className="ml-auto text-slate-300" />
                </button>
              </li>
            </ul>
          </section>

          <form action="/api/auth/logout" method="post">
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-bold text-rose-600 shadow-sm ring-1 ring-slate-200/70">
              <LogOut size={18} /> ออกจากระบบ
            </button>
          </form>
        </div>
        <Dialog variant="sheet" open={pwOpen} onClose={() => setPwOpen(false)} title="เปลี่ยนรหัสผ่าน">
          <PasswordForm onDone={pwDone} big />
        </Dialog>
      </MobileView>

      {/* ───────── คอม: การ์ดโปรไฟล์ด้านบน + ข้อมูล 2 คอลัมน์ ───────── */}
      <DesktopView>
        <div className="space-y-5">
          {banner}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-24 bg-gradient-to-r from-blue-600 via-blue-500 to-violet-500" />
            <div className="flex flex-wrap items-end gap-5 px-6 pb-5">
              <span className="-mt-12 grid size-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white ring-4 ring-white">
                <UserRound size={44} />
              </span>
              <div className="mr-auto min-w-0 pt-3">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{u.name}</h1>
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-white">{u.role === "ADMIN" ? "แอดมิน" : "พนักงาน"}</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{u.position} · {u.department} · รหัส {u.id}</p>
              </div>
              <form action="/api/auth/logout" method="post">
                <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50">
                  <LogOut size={16} /> ออกจากระบบ
                </button>
              </form>
            </div>
            <dl className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="px-6 py-4">
                  <dt className="text-xs text-slate-500">{s.label}</dt>
                  <dd className={`mt-0.5 text-xl font-bold tabular-nums ${s.tone ?? "text-slate-900"}`}>{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* ซ้าย: ข้อมูลพนักงาน + บัญชีรับเงิน */}
            <div className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-bold">ข้อมูลพนักงาน</h2>
                <p className="mb-2 text-xs text-slate-500">ต้องการแก้ไข ติดต่อแอดมิน</p>
                <dl className="divide-y divide-slate-100 text-sm">
                  {[
                    { icon: UserRound, label: "ชื่อ-นามสกุล", value: u.name },
                    { icon: Building2, label: "ฝ่าย / ตำแหน่ง", value: `${u.department} · ${u.position}` },
                    { icon: BadgeCheck, label: "ผู้อนุมัติใบเบิก", value: approverName },
                    { icon: AtSign, label: "Username", value: u.username },
                    { icon: Mail, label: "Email", value: u.email },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center gap-3 py-3">
                      <r.icon size={17} className="shrink-0 text-slate-400" />
                      <dt className="w-36 shrink-0 text-slate-500">{r.label}</dt>
                      <dd className="min-w-0 truncate font-bold text-slate-800">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-bold">บัญชีรับเงิน</h2>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white">
                  <Landmark size={96} className="absolute -right-4 -top-3 text-white/10" />
                  <p className="text-sm text-white/80">ธนาคาร{bank.bank}</p>
                  <p className="mt-3 font-mono text-2xl font-bold tracking-wider">{maskAcc(bank.no)}</p>
                  <p className="mt-2 text-sm">{bank.name}</p>
                </div>
                <p className="mt-3 text-xs text-slate-500">เงินเบิกและเงินยืมโอนเข้าบัญชีนี้ · เปลี่ยนบัญชีติดต่อฝ่ายบัญชี</p>
              </section>
            </div>

            {/* ขวา: การเข้าสู่ระบบ + แจ้งเตือน + เอกสาร */}
            <div className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <h2 className="px-6 pb-1 pt-5 font-bold">การเข้าสู่ระบบ</h2>
                <ul className="divide-y divide-slate-100">
                  <li className="flex items-center gap-4 px-6 py-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#06C755] text-white"><MessageCircle size={22} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><p className="font-bold">บัญชี LINE</p>{lineBadge}</div>
                      <p className="text-sm text-slate-500">{linked ? "เปิดจาก LINE ได้ทันที ไม่ต้องใส่รหัสผ่าน" : "ผูกเพื่อเข้าใช้ผ่านมือถือและรับแจ้งเตือน"}</p>
                    </div>
                    <button onClick={toggleLine} disabled={lineBusy}
                      className={linked
                        ? "shrink-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        : "shrink-0 rounded-xl bg-[#06C755] px-4 py-2.5 text-sm font-bold text-white hover:brightness-95"}>
                      {linked ? "ยกเลิกการผูก" : "ผูกบัญชี LINE"}
                    </button>
                  </li>
                  <li className="flex items-center gap-4 px-6 py-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><KeyRound size={22} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">รหัสผ่าน</p>
                      <p className="text-sm text-slate-500">ใช้เข้าระบบผ่านเว็บบนคอมพิวเตอร์</p>
                    </div>
                    <button onClick={() => setPwOpen(true)} className="shrink-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">เปลี่ยนรหัสผ่าน</button>
                  </li>
                </ul>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <h2 className="px-6 pb-1 pt-5 font-bold">การแจ้งเตือน</h2>
                <ul className="divide-y divide-slate-100">
                  {NOTIFY.map((n) => (
                    <li key={n.key}>
                      <label className="flex cursor-pointer items-center gap-4 px-6 py-4 hover:bg-slate-50/60">
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold">{n.label}</span>
                          <span className="text-sm text-slate-500">{n.hint}</span>
                        </span>
                        <input type="checkbox" className="peer sr-only" checked={notify[n.key]} onChange={() => setNotify({ ...notify, [n.key]: !notify[n.key] })} />
                        <span aria-hidden className="relative h-6 w-11 shrink-0 rounded-full bg-slate-200 transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:bg-blue-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100" />
                      </label>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><FileText size={22} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">แบบฟอร์มเอกสาร</p>
                  <p className="text-sm text-slate-500">ใบเบิก ใบสำคัญรับเงิน สัญญายืมเงิน และอื่น ๆ พร้อมพิมพ์</p>
                </div>
                <Link href="/print" className="shrink-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">เปิดดู</Link>
              </section>
            </div>
          </div>
        </div>
        <Dialog variant="modal" open={pwOpen} onClose={() => setPwOpen(false)} title="เปลี่ยนรหัสผ่าน">
          <PasswordForm onDone={pwDone} />
        </Dialog>
      </DesktopView>
    </>
  );
}
