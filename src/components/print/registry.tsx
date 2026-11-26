import type { ReactNode } from "react";
import type { Expense } from "@/lib/types";
import { ClaimDoc, ClearingDoc, LoanDoc, MemoDoc, ReceiptDoc, TravelDoc, VoucherDoc } from "./documents";

export interface DocDef {
  title: string;
  desc: string;
  /** ใบเบิกแบบไหนที่ใช้เอกสารนี้ได้ */
  accepts: (e: Expense) => boolean;
  /** ใบเบิกตัวอย่างที่เปิดเป็นค่าเริ่มต้น */
  sample: string;
  render: (e: Expense) => ReactNode;
}

const notAdvance = (e: Expense) => e.type !== "advance";

export const DOCS = {
  memo: {
    title: "บันทึกข้อความขออนุมัติเบิก", desc: "หนังสือภายในแบบราชการ เสนอผู้บังคับบัญชาพิจารณา พร้อมช่องความเห็นและคำสั่ง",
    accepts: notAdvance, sample: "EXP-6911-0012", render: (e) => <MemoDoc e={e} />,
  },
  claim: {
    title: "ใบเบิกค่าใช้จ่าย", desc: "รายการค่าใช้จ่าย รหัสบัญชี จำนวนเงินตัวอักษร และลายมือชื่อ 4 ฝ่าย",
    accepts: notAdvance, sample: "EXP-6911-0012", render: (e) => <ClaimDoc e={e} />,
  },
  travel: {
    title: "ใบเบิกค่าใช้จ่ายในการเดินทาง", desc: "แบบเบิกค่าเดินทางไปปฏิบัติงาน แยกเบี้ยเลี้ยง ที่พัก พาหนะ พร้อมใบรับเงิน",
    accepts: (e) => e.type === "travel", sample: "EXP-6911-0012", render: (e) => <TravelDoc e={e} />,
  },
  receipt: {
    title: "ใบสำคัญรับเงิน", desc: "ใช้แทนใบเสร็จ สำหรับรายการที่ไม่มีใบเสร็จ เช่น เบี้ยเลี้ยง ค่าพาหนะรับจ้าง",
    accepts: notAdvance, sample: "EXP-6911-0015", render: (e) => <ReceiptDoc e={e} />,
  },
  voucher: {
    title: "ใบสำคัญจ่าย", desc: "เอกสารฝ่ายบัญชีตอนจ่ายเงิน พร้อมรายการบันทึกบัญชี เดบิต / เครดิต",
    accepts: () => true, sample: "EXP-6910-0007", render: (e) => <VoucherDoc e={e} />,
  },
  loan: {
    title: "สัญญาการยืมเงิน", desc: "สัญญายืมเงินทดรองจ่าย 2 หน้า: คำขอ ความเห็น อนุมัติ ใบรับเงิน และรายการส่งใช้",
    accepts: (e) => e.type === "advance", sample: "ADV-6911-0003", render: (e) => <LoanDoc e={e} />,
  },
  clearing: {
    title: "ใบส่งใช้เงินยืม", desc: "เคลียร์เงินยืมด้วยค่าใช้จ่ายจริง คำนวณคืนเงินเหลือจ่ายหรือเบิกเพิ่ม",
    accepts: (e) => e.type === "advance", sample: "ADV-6911-0002", render: (e) => <ClearingDoc e={e} />,
  },
} satisfies Record<string, DocDef>;

export type DocKey = keyof typeof DOCS;
export const DOC_KEYS = Object.keys(DOCS) as DocKey[];
export const isDocKey = (k: string): k is DocKey => k in DOCS;
