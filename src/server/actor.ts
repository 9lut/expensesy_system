// ผู้ใช้ที่ทำรายการผ่าน API — มาจาก Session cookie (Phase 3)
// สคริปต์ทดสอบบนเครื่อง dev ระบุผู้ใช้ด้วย header `x-dev-user` ได้ (ปิดเสมอบน production)
import { headers } from "next/headers";
import type { Employee } from "@/lib/types";
import { DomainError } from "./errors";
import { getStore } from "./index";
import { getSession } from "./session";

export async function getActor(opts: { allowMustChange?: boolean } = {}): Promise<Employee> {
  const s = await getSession();
  let id = s?.sub;
  if (!id && process.env.NODE_ENV !== "production") id = (await headers()).get("x-dev-user") ?? undefined;
  if (!id) throw new DomainError(401, "กรุณาเข้าสู่ระบบ");
  if (s?.mc && !opts.allowMustChange) throw new DomainError(403, "ต้องเปลี่ยนรหัสผ่านก่อนใช้งาน");
  const emp = (await getStore().listEmployees()).find((e) => e.id === id);
  if (!emp) throw new DomainError(401, "ไม่พบผู้ใช้");
  if (!emp.active) throw new DomainError(403, "บัญชีนี้ถูกปิดการใช้งาน");
  return emp;
}
