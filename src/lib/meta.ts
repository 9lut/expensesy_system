import {
  CarFront, Receipt, Wallet, FileEdit, Clock, CheckCircle2, XCircle, Banknote, BadgeCheck,
  Undo2, Ban, FileSearch, CircleCheckBig,
  type LucideIcon,
} from "lucide-react";
import type { ExpenseStatus, ExpenseType } from "./types";

export const TYPE_META: Record<ExpenseType, { label: string; icon: LucideIcon; hint: string }> = {
  travel: { label: "ค่าเดินทาง", icon: CarFront, hint: "น้ำมัน ทางด่วน ตั๋ว ที่พัก" },
  general: { label: "ค่าใช้จ่ายทั่วไป", icon: Receipt, hint: "วัสดุ ค่ารับรอง อื่น ๆ" },
  advance: { label: "เงินยืมล่วงหน้า", icon: Wallet, hint: "ขอยืมเงินก่อนใช้จริง" },
};

export const STATUS_META: Record<ExpenseStatus, { label: string; icon: LucideIcon; cls: string }> = {
  draft: { label: "ร่าง", icon: FileEdit, cls: "bg-slate-500 text-white" },
  pending: { label: "รออนุมัติ", icon: Clock, cls: "bg-amber-600 text-white" },
  returned: { label: "ส่งกลับแก้ไข", icon: Undo2, cls: "bg-violet-600 text-white" },
  rejected: { label: "ไม่อนุมัติ", icon: XCircle, cls: "bg-rose-600 text-white" },
  approved: { label: "อนุมัติแล้ว", icon: CheckCircle2, cls: "bg-blue-600 text-white" },
  awaiting_payment: { label: "รอจ่าย", icon: Banknote, cls: "bg-orange-600 text-white" },
  paid: { label: "จ่ายแล้ว", icon: BadgeCheck, cls: "bg-emerald-600 text-white" },
  cancelled: { label: "ยกเลิก", icon: Ban, cls: "bg-stone-500 text-white" },
  clearing: { label: "รอตรวจเคลียร์", icon: FileSearch, cls: "bg-cyan-700 text-white" },
  cleared: { label: "เคลียร์แล้ว", icon: CircleCheckBig, cls: "bg-teal-600 text-white" },
};

/** ขั้นตอนหลักสำหรับ Stepper */
export const MAIN_STEPS: { key: ExpenseStatus; label: string }[] = [
  { key: "pending", label: "ส่งเบิก" },
  { key: "approved", label: "อนุมัติ" },
  { key: "awaiting_payment", label: "ตรวจเอกสาร" },
  { key: "paid", label: "จ่ายเงิน" },
];

export const EDITABLE: ExpenseStatus[] = ["draft", "returned"];
export const IN_PROGRESS: ExpenseStatus[] = ["pending", "approved", "awaiting_payment", "clearing"];
export const DONE: ExpenseStatus[] = ["paid", "cleared"];

export const baht = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(n);

export const thDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

export const thMonth = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { month: "long", year: "numeric" });
