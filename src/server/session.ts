// อ่าน/เขียน Session cookie ใน route handler และ server component
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Employee } from "@/lib/types";
import { getStore } from "./index";
import { SESSION_COOKIE, cookieOptions, createToken, verifyToken } from "./session-token";

export async function setSession(e: Pick<Employee, "id" | "role">, mustChange = false) {
  (await cookies()).set(SESSION_COOKIE, createToken({ sub: e.id, role: e.role, ...(mustChange ? { mc: 1 as const } : {}) }), cookieOptions());
}

export async function clearSession() {
  (await cookies()).set(SESSION_COOKIE, "", cookieOptions(0));
}

export async function getSession() {
  return verifyToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** สำหรับ layout / page: ผู้ใช้ที่ Login อยู่ (ข้อมูลล่าสุดจาก store) ไม่มี → ไปหน้า Login */
export async function requireUser(opts: { admin?: boolean } = {}): Promise<Employee> {
  const s = await getSession();
  if (!s) redirect("/login");
  const me = (await getStore().listEmployees()).find((e) => e.id === s.sub && e.active);
  if (!me) redirect("/login");
  if (s.mc) redirect("/change-password");
  if (opts.admin && me.role !== "ADMIN") redirect("/");
  return me;
}
