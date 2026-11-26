// รหัสผ่าน: bcrypt hash ที่ Next.js ฝั่งเซิร์ฟเวอร์เท่านั้น (ไม่ส่งรหัสผ่านเปล่าไป GAS / Sheet) — แผนข้อ 5.5
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { badRequest } from "./errors";

const COST = 10;

export const hashPassword = (pw: string) => bcrypt.hash(pw, COST);
export const checkPassword = (pw: string, hash?: string) => (hash ? bcrypt.compare(pw, hash) : Promise.resolve(false));

/** อย่างน้อย 8 ตัว มีทั้งตัวอักษรและตัวเลข */
export function assertPasswordPolicy(pw: string) {
  if (pw.length < 8 || pw.length > 72) throw badRequest("รหัสผ่านต้องยาว 8–72 ตัวอักษร");
  if (!/[A-Za-z฀-๿]/.test(pw) || !/\d/.test(pw)) throw badRequest("รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข");
}

/** รหัสชั่วคราว (แอดมินรีเซ็ตให้) — ตัดตัวที่สับสนง่าย เช่น 0/O 1/l ออก */
export function tempPassword(): string {
  const letters = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = letters + letters.toUpperCase() + digits;
  const pick = (s: string) => s[randomInt(s.length)];
  const chars = [pick(letters), pick(digits), ...Array.from({ length: 8 }, () => pick(all))];
  for (let i = chars.length - 1; i > 0; i--) { const j = randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.join("");
}
