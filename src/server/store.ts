// ชั้นเก็บข้อมูล: Google Sheet (GAS) หรือหน่วยความจำ (mock) — เปลี่ยนได้ด้วย DATA_SOURCE
import type { Category, Employee, Expense, ExpenseStatus, HistoryEntry } from "@/lib/types";

export interface Settings {
  advanceClearDays: number;
  maxReceiptAgeDays: number;
  mileageRate: number;
  fiscalYearStartMonth: number;
}

export const DEFAULT_SETTINGS: Settings = { advanceClearDays: 15, maxReceiptAgeDays: 90, mileageRate: 5, fiscalYearStartMonth: 1 };

export interface StoredFile {
  id: string;
  name: string;
  mime: string;
  ownerId: string;
  size: number;
  data: Uint8Array;
}

/** ข้อมูลบัญชีสำหรับ Login (มีเฉพาะฝั่งเซิร์ฟเวอร์ ห้ามส่งออก API) */
export interface AuthRecord {
  id: string;
  username: string;
  email: string;
  active: boolean;
  passwordHash?: string;
  mustChangePassword: boolean;
  failedLogins: number;
  lockedUntil?: string;
  lineUserId?: string;
  lineName?: string;
  resetTokenHash?: string;
  resetExpiresAt?: string;
}

/** ฟิลด์ที่แก้ได้ · ค่า "" = ล้างค่า */
export type AuthPatch = Partial<{
  passwordHash: string;
  mustChangePassword: boolean;
  failedLogins: number;
  lockedUntil: string;
  lastLoginAt: string;
  lineUserId: string;
  lineName: string;
  pictureUrl: string;
  lineLinkedAt: string;
  resetTokenHash: string;
  resetExpiresAt: string;
}>;

export interface Store {
  readonly name: "mock" | "gas";
  listExpenses(filter?: { employeeId?: string }): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | null>;
  /** บันทึกใบเบิกใหม่ — store ออกเลขที่ `${prefix}-${yymm}-####` เอง (ใน lock กันเลขซ้ำ) */
  insertExpense(e: Omit<Expense, "id">, prefix: "EXP" | "ADV", yymm: string): Promise<Expense>;
  /**
   * เขียนทับหัวเอกสาร + รายการ และต่อท้ายประวัติ `added` (ใน lock เดียว)
   * ล้มด้วย 409 ถ้าสถานะในฐานข้อมูลไม่ใช่ `expectedStatus` (มีคนแก้ไปก่อน)
   */
  saveExpense(e: Expense, expectedStatus: ExpenseStatus, added: HistoryEntry[]): Promise<Expense>;
  listCategories(): Promise<Category[]>;
  listEmployees(): Promise<Employee[]>;
  getSettings(): Promise<Settings>;
  putFile(f: Omit<StoredFile, "id">): Promise<string>;
  getFile(id: string): Promise<StoredFile | null>;

  /** ค้นบัญชีจาก Username/Email (ไม่สนตัวพิมพ์) หรือ LINE userId หรือรหัสพนักงาน */
  findAuth(q: { login?: string; lineUserId?: string; id?: string }): Promise<AuthRecord | null>;
  /** แก้ข้อมูลบัญชี · ผูก LINE ซ้ำกับคนอื่น → 409 */
  updateAuth(id: string, patch: AuthPatch): Promise<void>;
  /** ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลของพนักงานคนนั้น */
  sendResetEmail(id: string, link: string): Promise<void>;
}
