// ตัวเลขสำหรับแดชบอร์ดแอดมิน — คำนวณจากรายการใบเบิก (Phase 2 ใช้ข้อมูลจาก Sheet ชุดเดียวกัน)
import { CATEGORIES, MONTHLY } from "./mock";
import type { Expense, ExpenseStatus } from "./types";

const NOT_COUNTED: ExpenseStatus[] = ["draft", "cancelled", "rejected"];
const days = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
const sum = (l: Expense[]) => l.reduce((a, e) => a + e.total, 0);

export function monthCompare() {
  const t = (m: (typeof MONTHLY)[number]) => m.travel + m.general + m.advance;
  const cur = t(MONTHLY[MONTHLY.length - 1]);
  const prev = t(MONTHLY[MONTHLY.length - 2]);
  return { cur, prev, change: prev ? ((cur - prev) / prev) * 100 : 0 };
}

export function kpis(list: Expense[]) {
  const counted = list.filter((e) => !NOT_COUNTED.includes(e.status));

  // เวลาอนุมัติเฉลี่ย: ส่ง (pending) → ตัดสินใจ (อนุมัติ/ส่งกลับ/ไม่อนุมัติ)
  const decided = list
    .map((e) => {
      const sent = e.history.find((h) => h.status === "pending")?.at;
      const dec = e.history.find((h) => ["approved", "returned", "rejected"].includes(h.status));
      return sent && dec ? { d: days(sent, dec.at), s: dec.status } : null;
    })
    .filter((x): x is { d: number; s: ExpenseStatus } => !!x);
  const avgApproval = decided.length ? decided.reduce((a, x) => a + x.d, 0) / decided.length : 0;
  const bounced = decided.filter((x) => x.s !== "approved").length;

  const items = list.flatMap((e) => e.items).filter((i) => i.receipts > 0);
  const scanned = items.filter((i) => i.ocrTotal !== undefined);
  const mismatched = scanned.filter((i) => Math.abs((i.ocrTotal ?? 0) - i.amount) > 0.009);

  const openAdvance = list.filter((e) => e.type === "advance" && (e.status === "paid" || e.status === "clearing") && !!e.advanceDueDate);

  return {
    claims: counted.length,
    avgPerClaim: counted.length ? sum(counted) / counted.length : 0,
    avgApprovalDays: avgApproval,
    bounceRate: decided.length ? (bounced / decided.length) * 100 : 0,
    ocrRate: items.length ? (scanned.length / items.length) * 100 : 0,
    ocrMismatch: mismatched.length,
    openAdvance: sum(openAdvance),
    openAdvanceCount: openAdvance.length,
  };
}

export const PIPELINE: { status: ExpenseStatus; color: string }[] = [
  { status: "draft", color: "#cbd5e1" },
  { status: "pending", color: "#f59e0b" },
  { status: "returned", color: "#8b5cf6" },
  { status: "approved", color: "#3b82f6" },
  { status: "awaiting_payment", color: "#f97316" },
  { status: "paid", color: "#10b981" },
  { status: "clearing", color: "#06b6d4" },
  { status: "rejected", color: "#f43f5e" },
];

export function pipeline(list: Expense[]) {
  return PIPELINE.map((p) => {
    const l = list.filter((e) => e.status === p.status);
    return { ...p, count: l.length, amount: sum(l) };
  });
}

export function byDepartment(list: Expense[]) {
  const counted = list.filter((e) => !NOT_COUNTED.includes(e.status));
  const total = sum(counted) || 1;
  const m = new Map<string, { dept: string; count: number; amount: number }>();
  for (const e of counted) {
    const r = m.get(e.department) ?? { dept: e.department, count: 0, amount: 0 };
    r.count++;
    r.amount += e.total;
    m.set(e.department, r);
  }
  return [...m.values()].map((r) => ({ ...r, share: (r.amount / total) * 100 })).sort((a, b) => b.amount - a.amount);
}

export function byAccount(list: Expense[]) {
  const m = new Map<string, { code: string; name: string; count: number; amount: number }>();
  for (const e of list.filter((x) => !NOT_COUNTED.includes(x.status) && x.type !== "advance")) {
    for (const it of e.items) {
      const c = CATEGORIES.find((x) => x.name === it.category) ?? CATEGORIES[CATEGORIES.length - 1];
      const r = m.get(c.accountCode) ?? { code: c.accountCode, name: c.accountName, count: 0, amount: 0 };
      r.count++;
      r.amount += it.amount;
      m.set(c.accountCode, r);
    }
  }
  return [...m.values()].sort((a, b) => b.amount - a.amount);
}

export function topEmployees(list: Expense[], n = 5) {
  const m = new Map<string, { name: string; dept: string; count: number; amount: number }>();
  for (const e of list.filter((x) => !NOT_COUNTED.includes(x.status))) {
    const r = m.get(e.employeeId) ?? { name: e.employee, dept: e.department, count: 0, amount: 0 };
    r.count++;
    r.amount += e.total;
    m.set(e.employeeId, r);
  }
  return [...m.values()].sort((a, b) => b.amount - a.amount).slice(0, n);
}
