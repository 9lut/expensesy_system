// กฎธุรกิจทั้งหมดของใบเบิก (แผนข้อ 6, 7, 19) — store เป็นแค่ที่เก็บข้อมูล
import type { Category, Employee, Expense, ExpenseItem, ExpenseType, HistoryEntry } from "@/lib/types";
import { badRequest, forbidden, notFound } from "./errors";
import { ClearInput, ExpenseInput, ListQuery, NoteInput, PayInput, type ItemInput } from "./schema";
import { getStore } from "./index";
import type { Settings } from "./store";
import { EDITABLE_STATUS, canView, checkTransition, type Action } from "./workflow";

/* ───────── วันที่ (เวลาไทย) ───────── */
export const todayISO = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
const nowISO = () => new Date().toISOString();
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
/** ปี พ.ศ. 2 หลัก + เดือน เช่น 2026-11 → "6911" */
const yymm = (iso: string) => `${String((+iso.slice(0, 4) + 543) % 100).padStart(2, "0")}${iso.slice(5, 7)}`;
const fiscalYear = (iso: string, startMonth: number) => {
  const y = +iso.slice(0, 4) + 543;
  return startMonth > 1 && +iso.slice(5, 7) >= startMonth ? y + 1 : y;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

/* ───────── ตัวช่วย ───────── */
async function ctx() {
  const store = getStore();
  const [categories, employees, settings] = await Promise.all([store.listCategories(), store.listEmployees(), store.getSettings()]);
  return { store, categories, employees, settings };
}

const historyEntry = (actor: Employee, status: Expense["status"], from?: Expense["status"], note?: string): HistoryEntry =>
  ({ status, from, at: nowISO(), by: actor.name, byId: actor.id, ...(note ? { note } : {}) });

/** หมวดที่เป็นค่าเดินทางล้วน → ใบเบิกค่าเดินทาง */
const autoType = (items: ExpenseItem[], cats: Category[]): ExpenseType =>
  items.some((i) => { const c = cats.find((x) => x.name === i.category); return c?.appliesTo.includes("travel") && !c.appliesTo.includes("general"); }) ? "travel" : "general";

/** แปลงรายการที่รับเข้า + ตรวจกฎ (หมวด วันที่ ใบเสร็จ วงเงิน) */
function buildItems(inputs: ItemInput[], cats: Category[], s: Settings, opts: { requireReceipts: boolean }): ExpenseItem[] {
  const today = todayISO();
  return inputs.map((it, n) => {
    const row = `รายการที่ ${n + 1}`;
    const c = cats.find((x) => x.name === it.category && x.active);
    if (!c || !c.appliesTo.some((t) => t !== "advance")) throw badRequest(`${row}: ไม่พบหมวด “${it.category}”`);
    if (it.date > today) throw badRequest(`${row}: วันที่ใช้จ่ายเป็นวันในอนาคตไม่ได้`);
    if (daysBetween(it.date, today) > s.maxReceiptAgeDays) throw badRequest(`${row}: วันที่เก่ากว่า ${s.maxReceiptAgeDays} วัน`);
    if (opts.requireReceipts && c.receiptRequired && it.receiptIds.length === 0) throw badRequest(`${row}: หมวด “${c.name}” ต้องแนบใบเสร็จ`);
    return {
      date: it.date, description: it.description, category: c.name, amount: round2(it.amount),
      receipts: it.receiptIds.length, receiptIds: it.receiptIds,
      overLimit: !!c.limit && it.amount > c.limit,
      ...(it.ocrTotal !== undefined ? { ocrTotal: it.ocrTotal } : {}),
    };
  });
}

/** ประกอบหัวใบเบิกจากข้อมูลที่รับเข้า (ใช้ทั้งสร้างและแก้ไข) */
function compose(input: ExpenseInput, c: Awaited<ReturnType<typeof ctx>>) {
  const today = todayISO();
  if (input.kind === "advance") {
    if (input.neededDate < today) throw badRequest("วันที่ต้องการใช้เงินต้องไม่ใช่วันที่ผ่านมาแล้ว");
    const items: ExpenseItem[] = [{ date: input.neededDate, description: input.note || input.title, category: "อื่น ๆ", amount: round2(input.amount), receipts: 0, receiptIds: [] }];
    return { type: "advance" as const, title: input.title, purpose: input.note, items, total: round2(input.amount) };
  }
  const items = buildItems(input.items, c.categories, c.settings, { requireReceipts: input.submit });
  const type = input.type ?? autoType(items, c.categories);
  return { type, title: input.title, purpose: input.purpose, items, total: round2(items.reduce((a, i) => a + i.amount, 0)) };
}

/** หัวหน้าผู้อนุมัติ: supervisor ของพนักงาน → ไม่มีก็ ADMIN ที่มีสิทธิ์อนุมัติคนแรก */
const approverOf = (owner: Employee, emps: Employee[]) =>
  emps.find((x) => x.id === owner.supervisorId && x.active) ??
  emps.find((x) => x.active && x.role === "ADMIN" && x.id !== owner.id && (!x.permissions || x.permissions.includes("APPROVE")));

/* ───────── API ของ service ───────── */
export async function listExpenses(actor: Employee, raw: unknown) {
  const q = ListQuery.parse(raw);
  const store = getStore();
  const own = q.mine === "1" || actor.role !== "ADMIN";
  let list = await store.listExpenses(own ? { employeeId: actor.id } : q.employeeId ? { employeeId: q.employeeId } : undefined);
  if (q.status) { const st = q.status.split(","); list = list.filter((e) => st.includes(e.status)); }
  if (q.type) list = list.filter((e) => e.type === q.type);
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}

export async function getExpense(actor: Employee, id: string) {
  const e = await getStore().getExpense(id);
  if (!e) throw notFound("ไม่พบใบเบิกนี้");
  if (!canView(e, actor)) throw forbidden();
  return e;
}

export async function createExpense(actor: Employee, raw: unknown) {
  const input = ExpenseInput.parse(raw);
  const c = await ctx();
  const approver = approverOf(actor, c.employees);
  const body = compose(input, c);
  const today = todayISO();
  const status = input.submit ? "pending" : "draft";
  const e: Omit<Expense, "id"> = {
    ...body, employeeId: actor.id, employee: actor.name, department: actor.department,
    createdAt: today, status, approver: approver?.name, approverId: approver?.id,
    submittedAt: input.submit ? nowISO() : undefined, fiscalYear: fiscalYear(today, c.settings.fiscalYearStartMonth),
    history: [historyEntry(actor, status)],
  };
  return c.store.insertExpense(e, body.type === "advance" ? "ADV" : "EXP", yymm(today));
}

export async function updateExpense(actor: Employee, id: string, raw: unknown) {
  const input = ExpenseInput.parse(raw);
  const c = await ctx();
  const cur = await c.store.getExpense(id);
  if (!cur) throw notFound("ไม่พบใบเบิกนี้");
  if (cur.employeeId !== actor.id) throw forbidden("แก้ไขได้เฉพาะเจ้าของใบเบิก");
  if (!EDITABLE_STATUS.includes(cur.status)) throw badRequest("แก้ไขได้เฉพาะใบเบิกสถานะร่างหรือส่งกลับแก้ไข");
  if ((cur.type === "advance") !== (input.kind === "advance")) throw badRequest("เปลี่ยนชนิดใบเบิกไม่ได้ (เบิก ↔ ยืม)");
  const body = compose(input, c);
  const status = input.submit ? "pending" : cur.status;
  const added = status !== cur.status ? [historyEntry(actor, status, cur.status)] : [];
  return c.store.saveExpense({ ...cur, ...body, status, rejectReason: input.submit ? undefined : cur.rejectReason, submittedAt: input.submit ? nowISO() : cur.submittedAt }, cur.status, added);
}

export async function transition(actor: Employee, id: string, action: Action, raw: unknown) {
  const c = await ctx();
  const cur = await c.store.getExpense(id);
  if (!cur) throw notFound("ไม่พบใบเบิกนี้");
  if (!canView(cur, actor)) throw forbidden();
  const note = typeof raw === "object" && raw && "note" in raw && typeof raw.note === "string" ? raw.note : undefined;
  const to = checkTransition(cur, action, actor, note);
  let next: Expense = { ...cur, status: to };

  switch (action) {
    case "approve":
      next = { ...next, approver: actor.name, approverId: actor.id, approvedAt: nowISO() };
      break;
    case "reject":
    case "return":
      next = { ...next, rejectReason: NoteInput.parse(raw).note };
      break;
    case "submit":
      next = { ...next, rejectReason: undefined, submittedAt: nowISO() };
      // ตรวจใบเสร็จอีกครั้งตอนส่ง (ร่างอาจยังไม่ได้แนบ)
      for (const [n, it] of cur.items.entries()) {
        const cat = c.categories.find((x) => x.name === it.category);
        if (cur.type !== "advance" && cat?.receiptRequired && !(it.receiptIds?.length || it.receipts)) throw badRequest(`รายการที่ ${n + 1}: หมวด “${cat.name}” ต้องแนบใบเสร็จ`);
      }
      break;
    case "pay": {
      const p = PayInput.parse(raw);
      const at = p.at ?? todayISO();
      next = {
        ...next, paidBy: actor.name, payment: { method: p.method, ref: p.ref, at },
        ...(cur.type === "advance" ? { advanceDueDate: addDays(at, c.settings.advanceClearDays) } : {}),
      };
      break;
    }
    case "clear": {
      const p = ClearInput.parse(raw);
      const items = buildItems(p.items, c.categories, { ...c.settings, maxReceiptAgeDays: 3650 }, { requireReceipts: true });
      const actual = round2(items.reduce((a, i) => a + i.amount, 0));
      next = { ...next, items, advanceActual: actual, advanceDiff: round2(cur.total - actual) };
      break;
    }
  }
  return c.store.saveExpense(next, cur.status, [historyEntry(actor, to, cur.status, note?.trim() || undefined)]);
}

/* ───────── ไฟล์แนบ ───────── */
export const FILE_MAX = 10 * 1024 * 1024;
const FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

export async function uploadFile(actor: Employee, f: File) {
  if (!FILE_TYPES.includes(f.type)) throw badRequest("รองรับเฉพาะ JPG / PNG / WEBP / HEIC / PDF");
  if (f.size > FILE_MAX) throw badRequest("ไฟล์ใหญ่เกิน 10 MB");
  const id = await getStore().putFile({ name: f.name || "receipt", mime: f.type, ownerId: actor.id, size: f.size, data: new Uint8Array(await f.arrayBuffer()) });
  return { id, name: f.name, size: f.size, mime: f.type };
}

export async function readFile(actor: Employee, id: string) {
  const f = await getStore().getFile(id);
  if (!f) throw notFound("ไม่พบไฟล์");
  if (f.ownerId !== actor.id && actor.role !== "ADMIN") throw forbidden();
  return f;
}

export async function listCategories() {
  return (await getStore().listCategories()).filter((c) => c.active);
}

export async function listEmployees(actor: Employee) {
  if (actor.role !== "ADMIN") throw forbidden();
  return getStore().listEmployees();
}
