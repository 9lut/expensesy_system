export type ExpenseType = "travel" | "general" | "advance";

export type ExpenseStatus =
  | "draft"
  | "pending"
  | "returned"
  | "rejected"
  | "approved"
  | "awaiting_payment"
  | "paid"
  | "cancelled"
  | "clearing"
  | "cleared";

export type Role = "USER" | "ADMIN";

/** สิทธิ์ย่อยของ ADMIN · ไม่ระบุ = มีทุกสิทธิ์ */
export type Permission = "APPROVE" | "PAY" | "MANAGE";

export interface Employee {
  id: string;
  username: string;
  email: string;
  name: string;
  department: string;
  position: string;
  role: Role;
  lineLinked: boolean;
  lineName?: string;
  active: boolean;
  permissions?: Permission[];
  /** หัวหน้าผู้อนุมัติ (employees.id) */
  supervisorId?: string;
}

export interface Category {
  id: string;
  name: string;
  appliesTo: ExpenseType[];
  limit?: number;
  limitUnit?: string;
  receiptRequired: boolean;
  active: boolean;
  /** รหัสบัญชีค่าใช้จ่ายในผังบัญชี (ใช้ทำรายการบันทึกบัญชี) */
  accountCode: string;
  accountName: string;
}

export interface ExpenseItem {
  date: string;
  description: string;
  category: string;
  amount: number;
  receipts: number;
  overLimit?: boolean;
  /** ยอดที่ OCR อ่านได้จากใบเสร็จ (ไม่มี = ยังไม่ได้สแกน) */
  ocrTotal?: number;
  /** รหัสไฟล์ใบเสร็จ (Drive file id / รหัสในหน่วยความจำ) */
  receiptIds?: string[];
}

export interface Expense {
  id: string;
  type: ExpenseType;
  title: string;
  employeeId: string;
  employee: string;
  department: string;
  createdAt: string;
  total: number;
  status: ExpenseStatus;
  items: ExpenseItem[];
  approver?: string;
  approverId?: string;
  purpose?: string;
  submittedAt?: string;
  approvedAt?: string;
  paidBy?: string;
  rejectReason?: string;
  payment?: { method: string; ref: string; at: string };
  advanceDueDate?: string;
  advanceActual?: number;
  /** ยอดยืม − ใช้จริง (บวก = ต้องคืนเงิน, ลบ = เบิกเพิ่ม) */
  advanceDiff?: number;
  fiscalYear?: number;
  history: HistoryEntry[];
}

export interface HistoryEntry {
  status: ExpenseStatus;
  /** สถานะก่อนเปลี่ยน (ไม่มี = สร้างใหม่) */
  from?: ExpenseStatus;
  at: string;
  by: string;
  byId?: string;
  note?: string;
}
