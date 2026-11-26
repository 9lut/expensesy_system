// เก็บข้อมูลใน Google Sheet ผ่าน GAS — แปลงแถวชีต (snake_case, ตัวพิมพ์ใหญ่) ↔ ชนิดข้อมูลของแอป
import type { Category, Employee, Expense, ExpenseItem, ExpenseStatus, ExpenseType, HistoryEntry, Permission } from "@/lib/types";
import { gas } from "./gas-client";
import { DEFAULT_SETTINGS, type Settings, type Store } from "./store";

type Row = Record<string, string>;
interface Bundle { expenses: Row[]; items: Row[]; history: Row[] }
interface Boot { employees: Row[]; categories: Row[]; settings: Record<string, string> }

const num = (v?: string) => (v === undefined || v === "" ? undefined : Number(v));
const bool = (v?: string) => v === "TRUE";
const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const lower = <T extends string>(v: string) => v.toLowerCase() as T;

/* ───────── ข้อมูลตั้งต้น (cache 60 วินาที) ───────── */
let boot: { at: number; data: { employees: Employee[]; categories: Category[]; settings: Settings } } | null = null;

async function bootstrap() {
  if (boot && Date.now() - boot.at < 60_000) return boot.data;
  const b = await gas<Boot>("bootstrap");
  const employees: Employee[] = b.employees.map((r) => ({
    id: r.id, username: r.username, email: r.email,
    name: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.username,
    department: r.department, position: r.position,
    role: r.role === "ADMIN" ? "ADMIN" : "USER",
    lineLinked: !!r.line_user_id, lineName: r.line_name || undefined,
    active: r.status !== "INACTIVE",
    permissions: r.role === "ADMIN" && r.permissions ? (r.permissions.split(",").map((x) => x.trim()) as Permission[]) : undefined,
    supervisorId: r.supervisor_id || undefined,
  }));
  const categories: Category[] = b.categories.map((r) => ({
    id: r.id, name: r.name,
    appliesTo: r.applies_to.split(",").map((x) => lower<ExpenseType>(x.trim())),
    limit: num(r.limit_amount), limitUnit: r.limit_unit || undefined,
    receiptRequired: bool(r.receipt_required), active: r.active !== "FALSE",
    accountCode: r.account_code, accountName: r.account_name,
  }));
  const st = b.settings;
  const settings: Settings = {
    advanceClearDays: num(st.advance_clear_days) ?? DEFAULT_SETTINGS.advanceClearDays,
    maxReceiptAgeDays: num(st.max_receipt_age_days) ?? DEFAULT_SETTINGS.maxReceiptAgeDays,
    mileageRate: num(st.mileage_rate) ?? DEFAULT_SETTINGS.mileageRate,
    fiscalYearStartMonth: num(st.fiscal_year_start_month) ?? DEFAULT_SETTINGS.fiscalYearStartMonth,
  };
  boot = { at: Date.now(), data: { employees, categories, settings } };
  return boot.data;
}

/* ───────── แถว → แอป ───────── */
function toExpenses(b: Bundle, emps: Employee[], cats: Category[]): Expense[] {
  const name = (id?: string) => emps.find((e) => e.id === id)?.name ?? id ?? "";
  return b.expenses.map((r) => {
    const items: ExpenseItem[] = b.items
      .filter((i) => i.expense_id === r.id)
      .sort((a, z) => a.id.localeCompare(z.id))
      .map((i) => {
        const receiptIds = i.receipt_urls ? i.receipt_urls.split(",").filter(Boolean) : [];
        return {
          date: i.item_date, description: i.description,
          category: cats.find((c) => c.id === i.category_id)?.name ?? i.category_id,
          amount: Number(i.amount), receipts: receiptIds.length, receiptIds,
          overLimit: bool(i.over_limit), ocrTotal: num(i.ocr_total),
        };
      });
    const history: HistoryEntry[] = b.history
      .filter((h) => h.expense_id === r.id)
      .sort((a, z) => a.created_at.localeCompare(z.created_at))
      .map((h) => ({
        status: lower<ExpenseStatus>(h.to_status), from: h.from_status ? lower<ExpenseStatus>(h.from_status) : undefined,
        at: h.created_at, by: name(h.actor_id), byId: h.actor_id, note: h.note || undefined,
      }));
    const emp = emps.find((e) => e.id === r.employee_id);
    return {
      id: r.id, type: lower<ExpenseType>(r.type), title: r.title, purpose: r.purpose || undefined,
      employeeId: r.employee_id, employee: emp?.name ?? r.employee_id, department: emp?.department ?? "",
      createdAt: r.created_at, total: Number(r.total_amount), status: lower<ExpenseStatus>(r.status), items,
      approver: r.approver_id ? name(r.approver_id) : undefined, approverId: r.approver_id || undefined,
      approvedAt: r.approved_at || undefined, submittedAt: r.submitted_at || undefined,
      rejectReason: r.reject_reason || undefined,
      paidBy: r.paid_by ? name(r.paid_by) : undefined,
      payment: r.paid_at ? { method: r.payment_method, ref: r.payment_ref, at: r.paid_at } : undefined,
      advanceDueDate: r.advance_due_date || undefined,
      advanceActual: num(r.advance_actual), advanceDiff: num(r.advance_diff),
      fiscalYear: num(r.fiscal_year), history,
    };
  });
}

/* ───────── แอป → แถว ───────── */
function toRows(e: Omit<Expense, "id">, emps: Employee[], cats: Category[]) {
  const idOf = (nm?: string) => (nm ? emps.find((x) => x.name === nm)?.id ?? nm : "");
  const head: Row = {
    fiscal_year: s(e.fiscalYear), employee_id: e.employeeId, type: e.type.toUpperCase(), title: e.title, purpose: s(e.purpose),
    total_amount: e.total.toFixed(2), status: e.status.toUpperCase(),
    approver_id: e.approverId ?? idOf(e.approver), approved_at: s(e.approvedAt), reject_reason: s(e.rejectReason),
    paid_by: idOf(e.paidBy), paid_at: s(e.payment?.at), payment_method: s(e.payment?.method), payment_ref: s(e.payment?.ref),
    advance_due_date: s(e.advanceDueDate), advance_actual: e.advanceActual === undefined ? "" : e.advanceActual.toFixed(2),
    advance_diff: e.advanceDiff === undefined ? "" : e.advanceDiff.toFixed(2),
    created_at: e.createdAt, submitted_at: s(e.submittedAt),
  };
  const clearing = e.status === "clearing" || e.status === "cleared";
  const items: Row[] = e.items.map((i) => ({
    item_date: i.date, category_id: cats.find((c) => c.name === i.category)?.id ?? i.category, description: i.description,
    amount: i.amount.toFixed(2), receipt_urls: (i.receiptIds ?? []).join(","), over_limit: i.overLimit ? "TRUE" : "FALSE",
    is_clearing: clearing && e.type === "advance" ? "TRUE" : "FALSE",
    ocr_total: i.ocrTotal === undefined ? "" : String(i.ocrTotal), ocr_verified: i.ocrTotal === undefined ? "FALSE" : "TRUE",
  }));
  return { head, items };
}

const historyRows = (h: HistoryEntry[]): Row[] =>
  h.map((x) => ({ from_status: x.from ? x.from.toUpperCase() : "", to_status: x.status.toUpperCase(), actor_id: s(x.byId), note: s(x.note), created_at: x.at }));

export const gasStore: Store = {
  name: "gas",
  async listExpenses(filter) {
    const [{ employees, categories }, b] = await Promise.all([bootstrap(), gas<Bundle>("expense_list", { employee_id: filter?.employeeId })]);
    return toExpenses(b, employees, categories);
  },
  async getExpense(id) {
    const [{ employees, categories }, b] = await Promise.all([bootstrap(), gas<Bundle | null>("expense_get", { id })]);
    return b ? toExpenses(b, employees, categories)[0] ?? null : null;
  },
  async insertExpense(e, prefix, yymm) {
    const { employees, categories } = await bootstrap();
    const { head, items } = toRows(e, employees, categories);
    const { id } = await gas<{ id: string }>("expense_insert", { prefix, yymm, expense: head, items, history: historyRows(e.history) });
    return (await this.getExpense(id))!;
  },
  async saveExpense(e, expectedStatus, added) {
    const { employees, categories } = await bootstrap();
    const { head, items } = toRows(e, employees, categories);
    await gas("expense_save", { id: e.id, expected_status: expectedStatus.toUpperCase(), expense: head, items, history: historyRows(added) });
    return (await this.getExpense(e.id))!;
  },
  async listCategories() { return (await bootstrap()).categories; },
  async listEmployees() { return (await bootstrap()).employees; },
  async getSettings() { return (await bootstrap()).settings; },
  async putFile(f) {
    const { id } = await gas<{ id: string }>("file_put", { name: f.name, mime: f.mime, owner_id: f.ownerId, kind: "receipts", base64: Buffer.from(f.data).toString("base64") });
    return id;
  },
  async getFile(id) {
    const r = await gas<{ name: string; mime: string; base64: string; owner_id: string; size: number } | null>("file_get", { id });
    return r ? { id, name: r.name, mime: r.mime, ownerId: r.owner_id, size: r.size, data: new Uint8Array(Buffer.from(r.base64, "base64")) } : null;
  },

  async findAuth(q) {
    const r = await gas<Row | null>("auth_find", { login: q.login?.trim(), line_user_id: q.lineUserId, id: q.id });
    if (!r) return null;
    return {
      id: r.id, username: r.username, email: r.email, active: r.status !== "INACTIVE",
      passwordHash: r.password_hash || undefined, mustChangePassword: bool(r.must_change_password),
      failedLogins: num(r.failed_logins) ?? 0, lockedUntil: r.locked_until || undefined,
      lineUserId: r.line_user_id || undefined, lineName: r.line_name || undefined,
      resetTokenHash: r.reset_token_hash || undefined, resetExpiresAt: r.reset_expires_at || undefined,
    };
  },
  async updateAuth(id, patch) {
    const map: Record<string, string> = {
      passwordHash: "password_hash", mustChangePassword: "must_change_password", failedLogins: "failed_logins",
      lockedUntil: "locked_until", lastLoginAt: "last_login_at", lineUserId: "line_user_id", lineName: "line_name",
      pictureUrl: "picture_url", lineLinkedAt: "line_linked_at", resetTokenHash: "reset_token_hash", resetExpiresAt: "reset_expires_at",
    };
    const out: Row = {};
    for (const [k, v] of Object.entries(patch)) if (map[k]) out[map[k]] = typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : s(v);
    await gas("auth_update", { id, patch: out });
    boot = null; // สถานะ LINE ของพนักงานเปลี่ยน → โหลดใหม่
  },
  async sendResetEmail(id, link) {
    await gas("auth_send_reset", { id, link });
  },
};
