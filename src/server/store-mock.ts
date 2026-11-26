// เก็บข้อมูลในหน่วยความจำของเซิร์ฟเวอร์ (dev / เดโม) — เริ่มจากข้อมูลจำลองใน lib/mock
// ข้อมูลหายเมื่อรีสตาร์ต dev server · ใช้ globalThis ให้รอด Hot Reload
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { CATEGORIES, DEV_SEED_PASSWORD, EMPLOYEES, EXPENSES } from "@/lib/mock";
import type { Employee, Expense } from "@/lib/types";
import { conflict, notFound } from "./errors";
import { DEFAULT_SETTINGS, type AuthRecord, type Store, type StoredFile } from "./store";

interface MemDb {
  expenses: Expense[];
  files: Map<string, StoredFile>;
  employees: Employee[];
  auth: Map<string, AuthRecord>;
}
const g = globalThis as unknown as { __expenseMemDb?: MemDb };

function seed(): MemDb {
  // hash ครั้งเดียวตอนเริ่ม (ทุกคนใช้รหัสตั้งต้นเดียวกัน)
  const hash = bcrypt.hashSync(DEV_SEED_PASSWORD, 10);
  const auth = new Map<string, AuthRecord>(EMPLOYEES.map((e) => [e.id, {
    id: e.id, username: e.username, email: e.email, active: e.active,
    passwordHash: hash, mustChangePassword: false, failedLogins: 0,
    ...(e.lineLinked ? { lineUserId: `Umock${e.id}`, lineName: e.lineName } : {}),
  }]));
  return { expenses: structuredClone(EXPENSES), files: new Map(), employees: structuredClone(EMPLOYEES), auth };
}
const db = (): MemDb => {
  const cur = g.__expenseMemDb;
  // ข้อมูลที่สร้างจากโค้ดเวอร์ชันก่อน (ค้างข้าม Hot Reload) → เติมส่วนที่ยังไม่มี
  if (cur && (!cur.auth || !cur.employees)) { const fresh = seed(); cur.auth ??= fresh.auth; cur.employees ??= fresh.employees; }
  return (g.__expenseMemDb ??= seed());
};

export const mockStore: Store = {
  name: "mock",
  async listExpenses(filter) {
    const all = db().expenses;
    return structuredClone(filter?.employeeId ? all.filter((e) => e.employeeId === filter.employeeId) : all);
  },
  async getExpense(id) {
    const e = db().expenses.find((x) => x.id === id);
    return e ? structuredClone(e) : null;
  },
  async insertExpense(e, prefix, yymm) {
    const head = `${prefix}-${yymm}-`;
    const last = Math.max(0, ...db().expenses.filter((x) => x.id.startsWith(head)).map((x) => parseInt(x.id.slice(head.length), 10) || 0));
    const saved: Expense = { ...structuredClone(e), id: head + String(last + 1).padStart(4, "0") };
    db().expenses.unshift(saved);
    return structuredClone(saved);
  },
  async saveExpense(e, expectedStatus, added) {
    const list = db().expenses;
    const i = list.findIndex((x) => x.id === e.id);
    if (i < 0) throw conflict("ไม่พบใบเบิกนี้แล้ว");
    if (list[i].status !== expectedStatus) throw conflict("ใบเบิกถูกเปลี่ยนสถานะไปแล้ว กรุณาโหลดใหม่");
    list[i] = { ...structuredClone(e), history: [...list[i].history, ...added] };
    return structuredClone(list[i]);
  },
  async listCategories() { return structuredClone(CATEGORIES); },
  async listEmployees() {
    const { employees, auth } = db();
    return employees.map((e) => { const a = auth.get(e.id); return { ...structuredClone(e), lineLinked: !!a?.lineUserId, lineName: a?.lineName }; });
  },
  async getSettings() { return DEFAULT_SETTINGS; },
  async putFile(f) {
    const id = `mem_${randomUUID()}`;
    db().files.set(id, { ...f, id });
    return id;
  },
  async getFile(id) { return db().files.get(id) ?? null; },

  async findAuth(q) {
    const list = [...db().auth.values()];
    const login = q.login?.trim().toLowerCase();
    const a = q.id ? db().auth.get(q.id)
      : q.lineUserId ? list.find((x) => x.lineUserId === q.lineUserId)
      : login ? list.find((x) => x.username.toLowerCase() === login || x.email.toLowerCase() === login)
      : undefined;
    return a ? { ...a } : null;
  },
  async updateAuth(id, patch) {
    const a = db().auth.get(id);
    if (!a) throw notFound("ไม่พบบัญชี");
    if (patch.lineUserId && [...db().auth.values()].some((x) => x.id !== id && x.lineUserId === patch.lineUserId)) {
      throw conflict("บัญชี LINE นี้ผูกกับพนักงานคนอื่นแล้ว");
    }
    const clean = <T,>(v: T) => (v === "" ? undefined : v);
    db().auth.set(id, {
      ...a,
      ...("passwordHash" in patch ? { passwordHash: clean(patch.passwordHash) } : {}),
      ...("mustChangePassword" in patch ? { mustChangePassword: !!patch.mustChangePassword } : {}),
      ...("failedLogins" in patch ? { failedLogins: patch.failedLogins ?? 0 } : {}),
      ...("lockedUntil" in patch ? { lockedUntil: clean(patch.lockedUntil) } : {}),
      ...("lineUserId" in patch ? { lineUserId: clean(patch.lineUserId) } : {}),
      ...("lineName" in patch ? { lineName: clean(patch.lineName) } : {}),
      ...("resetTokenHash" in patch ? { resetTokenHash: clean(patch.resetTokenHash) } : {}),
      ...("resetExpiresAt" in patch ? { resetExpiresAt: clean(patch.resetExpiresAt) } : {}),
    });
  },
  async sendResetEmail(id, link) {
    // โหมดจำลองไม่มีอีเมลจริง — แสดงลิงก์ใน log ของ dev server
    console.info(`[mock mail] ลิงก์ตั้งรหัสผ่านใหม่ของ ${id}: ${link}`);
  },
};
