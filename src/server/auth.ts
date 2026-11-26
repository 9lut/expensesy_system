// ระบบ Login (แผนข้อ 5): Username/Email + Password, ล็อกเมื่อผิด, ลืมรหัสผ่าน, LINE Login + ผูกบัญชี
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { Employee } from "@/lib/types";
import { DomainError, badRequest, conflict, forbidden, notFound } from "./errors";
import { getStore } from "./index";
import { assertPasswordPolicy, checkPassword, hashPassword, tempPassword } from "./password";
import { can } from "./workflow";

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
const RESET_MINUTES = 30;
const BAD_LOGIN = "Username / Email หรือรหัสผ่านไม่ถูกต้อง";
/** hash หลอกไว้เทียบเวลา กันเดาว่ามีบัญชีหรือไม่จากความเร็วตอบ */
let dummyHash: Promise<string> | null = null;
const dummy = () => (dummyHash ??= hashPassword(randomBytes(12).toString("hex")));

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const isDev = () => process.env.NODE_ENV !== "production";

export const LoginInput = z.object({ login: z.string().trim().min(1, "กรอก Username หรือ Email").max(120), password: z.string().min(1, "กรอกรหัสผ่าน").max(200) });
export const PasswordInput = z.object({ current: z.string().min(1, "กรอกรหัสผ่านปัจจุบัน").max(200), next: z.string().max(200) });
export const ForgotInput = z.object({ email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง").max(120) });
export const ResetInput = z.object({ id: z.string().min(1), token: z.string().min(20).max(200), password: z.string().max(200) });

async function employeeOf(id: string): Promise<Employee> {
  const e = (await getStore().listEmployees()).find((x) => x.id === id);
  if (!e) throw notFound("ไม่พบข้อมูลพนักงาน");
  return e;
}

/* ───────── Username / Email + Password ───────── */
export async function login(raw: unknown) {
  const { login: id, password } = LoginInput.parse(raw);
  const store = getStore();
  const a = await store.findAuth({ login: id });
  if (!a || !a.passwordHash) {
    await checkPassword(password, await dummy());
    throw new DomainError(401, BAD_LOGIN);
  }
  if (!a.active) throw forbidden("บัญชีนี้ถูกปิดการใช้งาน ติดต่อแอดมิน");
  if (a.lockedUntil && Date.parse(a.lockedUntil) > Date.now()) {
    const min = Math.ceil((Date.parse(a.lockedUntil) - Date.now()) / 60_000);
    throw forbidden(`ใส่รหัสผ่านผิดหลายครั้ง บัญชีถูกล็อกชั่วคราว ลองใหม่ใน ${min} นาที`);
  }
  if (!(await checkPassword(password, a.passwordHash))) {
    const fails = a.failedLogins + 1;
    if (fails >= MAX_FAILS) {
      await store.updateAuth(a.id, { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() });
      throw forbidden(`ใส่รหัสผ่านผิด ${MAX_FAILS} ครั้ง บัญชีถูกล็อก ${LOCK_MINUTES} นาที`);
    }
    await store.updateAuth(a.id, { failedLogins: fails });
    throw new DomainError(401, `${BAD_LOGIN} (เหลืออีก ${MAX_FAILS - fails} ครั้งก่อนถูกล็อก)`);
  }
  await store.updateAuth(a.id, { failedLogins: 0, lockedUntil: "", lastLoginAt: new Date().toISOString() });
  return { employee: await employeeOf(a.id), mustChange: a.mustChangePassword };
}

export async function changePassword(actor: Employee, raw: unknown) {
  const { current, next } = PasswordInput.parse(raw);
  const store = getStore();
  const a = await store.findAuth({ id: actor.id });
  if (!a) throw notFound("ไม่พบบัญชี");
  if (!(await checkPassword(current, a.passwordHash))) throw badRequest("รหัสผ่านปัจจุบันไม่ถูกต้อง");
  assertPasswordPolicy(next);
  if (next === current) throw badRequest("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม");
  await store.updateAuth(a.id, { passwordHash: await hashPassword(next), mustChangePassword: false, resetTokenHash: "", resetExpiresAt: "" });
}

/** ส่งลิงก์ตั้งรหัสใหม่ — ตอบเหมือนกันเสมอ ไม่บอกว่ามีอีเมลนี้หรือไม่ */
export async function forgotPassword(raw: unknown, baseUrl: string): Promise<{ devLink?: string }> {
  const { email } = ForgotInput.parse(raw);
  const store = getStore();
  const a = await store.findAuth({ login: email });
  if (!a || !a.active || a.email.toLowerCase() !== email.toLowerCase()) return {};
  const token = randomBytes(32).toString("base64url");
  await store.updateAuth(a.id, { resetTokenHash: sha256(token), resetExpiresAt: new Date(Date.now() + RESET_MINUTES * 60_000).toISOString() });
  const link = `${baseUrl}/reset-password?id=${encodeURIComponent(a.id)}&token=${token}`;
  await store.sendResetEmail(a.id, link);
  // โหมดข้อมูลจำลองไม่มีอีเมลจริง → ส่งลิงก์กลับให้หน้าเว็บแสดง (เฉพาะ dev)
  return store.name === "mock" && isDev() ? { devLink: link } : {};
}

export async function resetPassword(raw: unknown) {
  const { id, token, password } = ResetInput.parse(raw);
  const store = getStore();
  const a = await store.findAuth({ id });
  const bad = () => badRequest("ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่");
  if (!a || !a.active || !a.resetTokenHash || !a.resetExpiresAt) throw bad();
  if (Date.parse(a.resetExpiresAt) < Date.now()) throw bad();
  const given = Buffer.from(sha256(token));
  const stored = Buffer.from(a.resetTokenHash);
  if (given.length !== stored.length || !timingSafeEqual(given, stored)) throw bad();
  assertPasswordPolicy(password);
  await store.updateAuth(a.id, {
    passwordHash: await hashPassword(password), mustChangePassword: false,
    resetTokenHash: "", resetExpiresAt: "", failedLogins: 0, lockedUntil: "",
  });
}

/** แอดมิน (สิทธิ์ MANAGE) ตั้งรหัสชั่วคราวให้พนักงาน → พนักงานต้องเปลี่ยนตอน Login ครั้งถัดไป */
export async function adminResetPassword(actor: Employee, id: string) {
  if (!can(actor, "MANAGE")) throw forbidden("ต้องมีสิทธิ์ MANAGE");
  const a = await getStore().findAuth({ id });
  if (!a) throw notFound("ไม่พบพนักงาน");
  const temp = tempPassword();
  await getStore().updateAuth(id, { passwordHash: await hashPassword(temp), mustChangePassword: true, failedLogins: 0, lockedUntil: "", resetTokenHash: "", resetExpiresAt: "" });
  return { tempPassword: temp };
}

/* ───────── LINE ───────── */
interface LineProfile { userId: string; name: string; picture?: string }

/** ตรวจ LINE ID Token กับ LINE ทุกครั้ง (แผนข้อ 5.5) */
export async function verifyLineIdToken(idToken: string): Promise<LineProfile> {
  const channel = process.env.LINE_CHANNEL_ID;
  if (!channel) {
    // dev ที่ยังไม่มี LINE Channel: รับโทเคนจำลอง "dev:<userId>:<ชื่อ>"
    if (isDev() && idToken.startsWith("dev:")) {
      const [, userId, name] = idToken.split(":");
      if (userId) return { userId, name: name || "LINE (dev)" };
    }
    throw new DomainError(500, "ยังไม่ได้ตั้งค่า LINE_CHANNEL_ID");
  }
  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    body: new URLSearchParams({ id_token: idToken, client_id: channel }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!res) throw new DomainError(502, "เชื่อมต่อ LINE ไม่ได้");
  if (!res.ok) throw new DomainError(401, "LINE token ไม่ถูกต้องหรือหมดอายุ กรุณาเปิดใหม่จาก LINE");
  const j = (await res.json()) as { sub: string; name?: string; picture?: string };
  return { userId: j.sub, name: j.name ?? "LINE", picture: j.picture };
}

export const LineInput = z.object({ idToken: z.string().min(10).max(4000) });
export const LineLinkInput = LineInput.extend({ login: z.string().trim().max(120).optional(), password: z.string().max(200).optional() });

/** เปิดจาก LIFF: ผูกแล้ว → เข้าระบบ · ยังไม่ผูก → ให้กรอกบัญชีเพื่อผูก */
export async function lineLogin(raw: unknown) {
  const { idToken } = LineInput.parse(raw);
  const p = await verifyLineIdToken(idToken);
  const a = await getStore().findAuth({ lineUserId: p.userId });
  if (!a) return { status: "need_link" as const, lineName: p.name, picture: p.picture };
  if (!a.active) throw forbidden("บัญชีนี้ถูกปิดการใช้งาน ติดต่อแอดมิน");
  await getStore().updateAuth(a.id, { lastLoginAt: new Date().toISOString() });
  return { status: "ok" as const, employee: await employeeOf(a.id), mustChange: a.mustChangePassword };
}

async function linkTo(id: string, p: LineProfile) {
  const store = getStore();
  const a = await store.findAuth({ id });
  if (!a) throw notFound("ไม่พบบัญชี");
  if (a.lineUserId && a.lineUserId !== p.userId) throw conflict("บัญชีนี้ผูก LINE อื่นอยู่แล้ว ยกเลิกการผูกเดิมที่หน้าโปรไฟล์ก่อน");
  await store.updateAuth(id, { lineUserId: p.userId, lineName: p.name, pictureUrl: p.picture ?? "", lineLinkedAt: new Date().toISOString() });
}

/**
 * ผูก LINE กับบัญชี
 * - มี Session (หน้าโปรไฟล์) → ผูกกับผู้ใช้ปัจจุบัน
 * - ไม่มี Session (LIFF ครั้งแรก) → ต้องกรอก Username/Email + Password ก่อน
 */
export async function lineLink(raw: unknown, actor?: Employee) {
  const { idToken, login: id, password } = LineLinkInput.parse(raw);
  const p = await verifyLineIdToken(idToken);
  if (actor) {
    await linkTo(actor.id, p);
    return { employee: await employeeOf(actor.id), mustChange: false };
  }
  if (!id || !password) throw badRequest("กรอก Username / Email และรหัสผ่าน");
  const r = await login({ login: id, password });
  await linkTo(r.employee.id, p);
  return r;
}

export async function lineLinkProfile(actor: Employee, p: LineProfile) {
  await linkTo(actor.id, p);
}

export async function lineUnlink(actor: Employee) {
  await getStore().updateAuth(actor.id, { lineUserId: "", lineName: "", pictureUrl: "", lineLinkedAt: "" });
}

/** ผู้ใช้ LINE (web login) → บัญชีที่ผูกไว้ */
export async function findByLine(userId: string) {
  const a = await getStore().findAuth({ lineUserId: userId });
  if (!a) return null;
  if (!a.active) throw forbidden("บัญชีนี้ถูกปิดการใช้งาน ติดต่อแอดมิน");
  return { employee: await employeeOf(a.id), mustChange: a.mustChangePassword };
}

/* ───────── LINE Login บนเว็บ (คอม): ผูกบัญชีจากหน้าโปรไฟล์ / เข้าระบบด้วย LINE ───────── */
export function lineAuthorizeUrl(redirectUri: string, state: string): string {
  const channel = process.env.LINE_CHANNEL_ID;
  if (!channel) {
    if (isDev()) return `${redirectUri}?code=dev&state=${state}`;
    throw new DomainError(500, "ยังไม่ได้ตั้งค่า LINE_CHANNEL_ID");
  }
  const q = new URLSearchParams({ response_type: "code", client_id: channel, redirect_uri: redirectUri, state, scope: "openid profile" });
  return `https://access.line.me/oauth2/v2.1/authorize?${q}`;
}

/** แลก code → ID Token → โปรไฟล์ LINE ที่ตรวจแล้ว */
export async function lineExchangeCode(code: string, redirectUri: string, state: string): Promise<LineProfile> {
  const channel = process.env.LINE_CHANNEL_ID;
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!channel && isDev() && code === "dev") return verifyLineIdToken(`dev:Udev${sha256(state).slice(0, 10)}:LINE (dev)`);
  if (!channel || !secret) throw new DomainError(500, "ยังไม่ได้ตั้งค่า LINE_CHANNEL_ID / LINE_CHANNEL_SECRET");
  const res = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: channel, client_secret: secret }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!res?.ok) throw new DomainError(401, "LINE Login ไม่สำเร็จ ลองใหม่อีกครั้ง");
  const j = (await res.json()) as { id_token?: string };
  if (!j.id_token) throw new DomainError(401, "LINE ไม่ได้ส่ง ID Token กลับมา");
  return verifyLineIdToken(j.id_token);
}

/** URL ฐานของแอป (ใช้ทำลิงก์ในอีเมล / redirect_uri) */
export function baseUrlOf(req: Request): string {
  const env = process.env.APP_URL?.replace(/\/+$/, "");
  if (env) return env;
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}
