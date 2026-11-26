// โทเคน Session ลงลายเซ็น HMAC-SHA256 (ไม่มีสถานะฝั่งเซิร์ฟเวอร์) — ใช้ได้ทั้งใน proxy และ route handler
// รูปแบบ: v1.<base64url(JSON)>.<base64url(HMAC)>
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Role } from "@/lib/types";

export const SESSION_COOKIE = "ee_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 วัน (แผนข้อ 5.5)

export interface SessionPayload {
  /** รหัสพนักงาน */
  sub: string;
  role: Role;
  /** ต้องเปลี่ยนรหัสผ่านก่อนใช้งาน */
  mc?: 1;
  iat: number;
  exp: number;
}

let warned = false;
function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("ต้องตั้ง SESSION_SECRET (อย่างน้อย 32 ตัวอักษร) บน production");
  if (!warned) { console.warn("[session] ยังไม่ได้ตั้ง SESSION_SECRET — ใช้คีย์สำหรับ dev เท่านั้น"); warned = true; }
  return "dev-only-insecure-session-secret-change-me-0000";
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const sign = (data: string) => createHmac("sha256", secret()).update(data).digest();

export function createToken(p: Omit<SessionPayload, "iat" | "exp">, maxAge = SESSION_MAX_AGE): string {
  const now = Math.floor(Date.now() / 1000);
  const body = b64(JSON.stringify({ ...p, iat: now, exp: now + maxAge }));
  return `v1.${body}.${b64(sign(`v1.${body}`))}`;
}

export function verifyToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [v, body, sig] = token.split(".");
  if (v !== "v1" || !body || !sig) return null;
  const expected = sign(`v1.${body}`);
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!p.sub || typeof p.exp !== "number" || p.exp < Date.now() / 1000) return null;
    return p;
  } catch {
    return null;
  }
}

export const cookieOptions = (maxAge = SESSION_MAX_AGE) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});
