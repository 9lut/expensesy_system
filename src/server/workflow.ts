// กฎการเปลี่ยนสถานะใบเบิก (แผนข้อ 6 / 7.3) — ตรวจฝั่งเซิร์ฟเวอร์เท่านั้น ข้ามขั้นไม่ได้
import type { Employee, Expense, ExpenseStatus, ExpenseType, Permission } from "@/lib/types";
import { badRequest, conflict, forbidden } from "./errors";

export type Action = "submit" | "cancel" | "approve" | "reject" | "return" | "verify" | "pay" | "clear" | "close";
export const ACTIONS: Action[] = ["submit", "cancel", "approve", "reject", "return", "verify", "pay", "clear", "close"];

interface Rule {
  from: ExpenseStatus[];
  to: ExpenseStatus;
  /** owner = เจ้าของใบเบิก · Permission = ADMIN ที่มีสิทธิ์นั้น (และห้ามทำกับใบของตัวเอง) */
  who: "owner" | Permission;
  noteRequired?: boolean;
  types?: ExpenseType[];
  label: string;
}

export const RULES: Record<Action, Rule> = {
  submit: { from: ["draft", "returned"], to: "pending", who: "owner", label: "ส่งใบเบิก" },
  cancel: { from: ["draft", "pending", "returned"], to: "cancelled", who: "owner", label: "ยกเลิก" },
  approve: { from: ["pending"], to: "approved", who: "APPROVE", label: "อนุมัติ" },
  reject: { from: ["pending"], to: "rejected", who: "APPROVE", noteRequired: true, label: "ไม่อนุมัติ" },
  return: { from: ["pending"], to: "returned", who: "APPROVE", noteRequired: true, label: "ส่งกลับแก้ไข" },
  verify: { from: ["approved"], to: "awaiting_payment", who: "PAY", label: "ตรวจเอกสารผ่าน" },
  pay: { from: ["awaiting_payment"], to: "paid", who: "PAY", label: "บันทึกการจ่าย" },
  clear: { from: ["paid"], to: "clearing", who: "owner", types: ["advance"], label: "ส่งเคลียร์เงินยืม" },
  close: { from: ["clearing"], to: "cleared", who: "PAY", types: ["advance"], label: "ปิดเงินยืม" },
};

export const EDITABLE_STATUS: ExpenseStatus[] = ["draft", "returned"];

export const can = (u: Employee, p: Permission) => u.role === "ADMIN" && (!u.permissions || u.permissions.includes(p));

/** ตรวจว่าผู้ใช้ทำ action นี้กับใบเบิกนี้ได้ไหม → คืนสถานะปลายทาง หรือโยน DomainError */
export function checkTransition(e: Expense, action: Action, actor: Employee, note?: string): ExpenseStatus {
  const r = RULES[action];
  if (r.types && !r.types.includes(e.type)) throw badRequest(`${r.label} ใช้ได้เฉพาะเงินยืม`);
  if (r.who === "owner") {
    if (e.employeeId !== actor.id) throw forbidden("ทำได้เฉพาะเจ้าของใบเบิก");
  } else {
    if (!can(actor, r.who)) throw forbidden(`ต้องมีสิทธิ์ ${r.who}`);
    if (e.employeeId === actor.id) throw forbidden("ห้ามอนุมัติหรือจ่ายใบเบิกของตัวเอง");
  }
  if (!r.from.includes(e.status)) throw conflict(`ใบเบิกสถานะนี้ทำ “${r.label}” ไม่ได้`);
  if (r.noteRequired && !note?.trim()) throw badRequest("ต้องระบุเหตุผล");
  return r.to;
}

/** ผู้ใช้เห็นใบเบิกนี้ได้ไหม (เจ้าของ หรือ ADMIN) */
export const canView = (e: Pick<Expense, "employeeId">, u: Employee) => e.employeeId === u.id || u.role === "ADMIN";
