// ข้อมูลจำลองสำหรับ Phase 1 (ยังไม่เชื่อม Google Sheet)
import type { Category, Employee, Expense } from "./types";

/** วันที่อ้างอิงของข้อมูลจำลอง (ใช้แทนวันนี้ เพื่อให้คำนวณได้ผลคงที่) */
export const TODAY = "2026-11-25";

export const daysFromToday = (iso: string) =>
  Math.round((new Date(iso).getTime() - new Date(TODAY).getTime()) / 86_400_000);

export const EMPLOYEES: Employee[] = [
  { id: "EMP001", username: "somchai", email: "somchai@company.co.th", name: "สมชาย ใจดี", department: "ฝ่ายขาย", position: "เจ้าหน้าที่ขาย", role: "USER", lineLinked: false, active: true },
  { id: "EMP002", username: "manee", email: "manee@company.co.th", name: "มานี รักงาน", department: "ฝ่ายการตลาด", position: "นักการตลาด", role: "USER", lineLinked: true, lineName: "Manee", active: true },
  { id: "EMP003", username: "prayut", email: "prayut@company.co.th", name: "ประยุทธ์ ช่างดี", department: "ฝ่ายผลิต", position: "ช่างเทคนิค", role: "USER", lineLinked: true, lineName: "Prayut", active: true },
  { id: "EMP004", username: "wichai", email: "wichai@company.co.th", name: "วิชัย หัวหน้า", department: "ฝ่ายขาย", position: "ผู้จัดการฝ่ายขาย", role: "ADMIN", lineLinked: true, lineName: "Wichai", active: true },
  { id: "EMP005", username: "suda", email: "suda@company.co.th", name: "สุดา การเงิน", department: "ฝ่ายบัญชี", position: "นักบัญชี", role: "ADMIN", lineLinked: false, active: true, permissions: ["PAY", "MANAGE"] },
  { id: "EMP006", username: "kittipong", email: "kittipong@company.co.th", name: "กิตติพงษ์ ลาออก", department: "ฝ่ายขาย", position: "เจ้าหน้าที่ขาย", role: "USER", lineLinked: false, active: false },
];

/**
 * รหัสผ่านตั้งต้นของบัญชีตัวอย่างทุกคน — ใช้เฉพาะโหมดข้อมูลจำลอง (DATA_SOURCE ไม่ใช่ gas) บนเครื่อง dev
 * ระบบจริงตั้งรหัสผ่านด้วย scripts/set-password.mjs หรือปุ่มรีเซ็ตรหัสผ่านของแอดมิน
 */
export const DEV_SEED_PASSWORD = "demo1234";

/** บัญชีรับเงินของพนักงาน (ตัวอย่าง) */
export const BANK_ACCOUNTS: Record<string, { bank: string; no: string; name: string }> = {
  EMP001: { bank: "กสิกรไทย", no: "123-4-56789-0", name: "สมชาย ใจดี" },
  EMP002: { bank: "ไทยพาณิชย์", no: "456-7-89012-3", name: "มานี รักงาน" },
  EMP003: { bank: "กรุงเทพ", no: "789-0-12345-6", name: "ประยุทธ์ ช่างดี" },
};

export const CURRENT_USER = EMPLOYEES[0];
export const CURRENT_ADMIN = EMPLOYEES[3];

export const CATEGORIES: Category[] = [
  { id: "C01", name: "ค่าน้ำมัน", appliesTo: ["travel"], receiptRequired: true, active: true, accountCode: "5311", accountName: "ค่าน้ำมันเชื้อเพลิง" },
  { id: "C02", name: "ค่าทางด่วน / ที่จอดรถ", appliesTo: ["travel"], receiptRequired: true, active: true, accountCode: "5312", accountName: "ค่าทางด่วนและที่จอดรถ" },
  { id: "C03", name: "ค่าที่พัก", appliesTo: ["travel"], limit: 1500, limitUnit: "คืน", receiptRequired: true, active: true, accountCode: "5313", accountName: "ค่าที่พัก" },
  { id: "C04", name: "ค่าเบี้ยเลี้ยง", appliesTo: ["travel"], limit: 300, limitUnit: "วัน", receiptRequired: false, active: true, accountCode: "5314", accountName: "ค่าเบี้ยเลี้ยง" },
  { id: "C05", name: "ค่าอาหาร / รับรอง", appliesTo: ["general"], limit: 2000, limitUnit: "รายการ", receiptRequired: true, active: true, accountCode: "5320", accountName: "ค่ารับรอง" },
  { id: "C06", name: "วัสดุสำนักงาน", appliesTo: ["general"], receiptRequired: true, active: true, accountCode: "5330", accountName: "วัสดุสิ้นเปลืองสำนักงาน" },
  { id: "C08", name: "ค่าแท็กซี่ / รถรับจ้าง", appliesTo: ["travel"], receiptRequired: true, active: true, accountCode: "5315", accountName: "ค่าพาหนะรับจ้าง" },
  { id: "C09", name: "ค่าตั๋วเดินทาง", appliesTo: ["travel"], receiptRequired: true, active: true, accountCode: "5316", accountName: "ค่าตั๋วโดยสาร" },
  { id: "C10", name: "ค่าไปรษณีย์ / ขนส่ง", appliesTo: ["general"], receiptRequired: true, active: true, accountCode: "5340", accountName: "ค่าไปรษณีย์และขนส่ง" },
  { id: "C11", name: "ค่าโทรศัพท์ / อินเทอร์เน็ต", appliesTo: ["general"], limit: 1000, limitUnit: "เดือน", receiptRequired: true, active: true, accountCode: "5350", accountName: "ค่าสื่อสาร" },
  // "อื่น ๆ" ต้องอยู่ท้ายสุดเสมอ (ใช้เป็นหมวดสำรอง)
  { id: "C07", name: "อื่น ๆ", appliesTo: ["travel", "general", "advance"], receiptRequired: true, active: true, accountCode: "5390", accountName: "ค่าใช้จ่ายเบ็ดเตล็ด" },
];

/** บัญชีฝั่งเครดิต/ทดรอง (ผังบัญชีตัวอย่าง) */
export const LEDGER = {
  accruedEmployee: { code: "2141", name: "ค่าใช้จ่ายค้างจ่าย – พนักงาน" },
  advance: { code: "1141", name: "เงินทดรองจ่ายพนักงาน" },
  bank: { code: "1112", name: "เงินฝากธนาคาร – กระแสรายวัน" },
};

const h = (status: Expense["status"], at: string, by: string, note?: string) => ({ status, at, by, note });

export const EXPENSES: Expense[] = [
  {
    id: "EXP-6911-0012", type: "travel", title: "เดินทางพบลูกค้า เชียงใหม่", employeeId: "EMP001", employee: "สมชาย ใจดี",
    department: "ฝ่ายขาย", createdAt: "2026-11-20", total: 4850, status: "pending", approver: "วิชัย หัวหน้า",
    items: [
      { date: "2026-11-18", description: "เติมน้ำมัน ไป-กลับ", category: "ค่าน้ำมัน", amount: 1850, receipts: 2, ocrTotal: 1850 },
      { date: "2026-11-18", description: "ทางด่วน", category: "ค่าทางด่วน / ที่จอดรถ", amount: 300, receipts: 1, ocrTotal: 300 },
      { date: "2026-11-19", description: "โรงแรม 1 คืน", category: "ค่าที่พัก", amount: 2700, receipts: 1, overLimit: true, ocrTotal: 2500 },
    ],
    history: [h("draft", "2026-11-20", "สมชาย ใจดี"), h("pending", "2026-11-20", "สมชาย ใจดี")],
  },
  {
    id: "EXP-6911-0011", type: "general", title: "ซื้อวัสดุสำนักงาน", employeeId: "EMP001", employee: "สมชาย ใจดี",
    department: "ฝ่ายขาย", createdAt: "2026-11-15", total: 1290, status: "awaiting_payment", approver: "วิชัย หัวหน้า",
    items: [{ date: "2026-11-14", description: "กระดาษ A4 / ปากกา", category: "วัสดุสำนักงาน", amount: 1290, receipts: 1 }],
    history: [
      h("pending", "2026-11-15", "สมชาย ใจดี"),
      h("approved", "2026-11-16", "วิชัย หัวหน้า"),
      h("awaiting_payment", "2026-11-17", "สุดา การเงิน", "เอกสารครบ"),
    ],
  },
  {
    id: "EXP-6911-0010", type: "general", title: "ค่าอาหารประชุมทีม", employeeId: "EMP001", employee: "สมชาย ใจดี",
    department: "ฝ่ายขาย", createdAt: "2026-11-12", total: 650, status: "returned", approver: "วิชัย หัวหน้า",
    rejectReason: "ใบเสร็จไม่ชัด กรุณาถ่ายใหม่",
    items: [{ date: "2026-11-11", description: "ข้าวกล่อง 10 ชุด", category: "ค่าอาหาร / รับรอง", amount: 650, receipts: 1 }],
    history: [h("pending", "2026-11-12", "สมชาย ใจดี"), h("returned", "2026-11-13", "วิชัย หัวหน้า", "ใบเสร็จไม่ชัด กรุณาถ่ายใหม่")],
  },
  {
    id: "EXP-6911-0009", type: "general", title: "ค่าส่งเอกสารด่วน", employeeId: "EMP001", employee: "สมชาย ใจดี",
    department: "ฝ่ายขาย", createdAt: "2026-11-24", total: 320, status: "draft",
    items: [{ date: "2026-11-24", description: "Kerry Express", category: "อื่น ๆ", amount: 320, receipts: 0 }],
    history: [h("draft", "2026-11-24", "สมชาย ใจดี")],
  },
  {
    id: "ADV-6911-0003", type: "advance", title: "ยืมเงินล่วงหน้า งานสัมมนา", employeeId: "EMP001", employee: "สมชาย ใจดี",
    department: "ฝ่ายขาย", createdAt: "2026-11-05", total: 8000, status: "paid", approver: "วิชัย หัวหน้า",
    advanceDueDate: "2026-11-28", payment: { method: "โอนเงิน", ref: "KB-88213", at: "2026-11-07" },
    items: [{ date: "2026-11-05", description: "ค่าลงทะเบียน + เดินทาง", category: "อื่น ๆ", amount: 8000, receipts: 0 }],
    history: [
      h("pending", "2026-11-05", "สมชาย ใจดี"),
      h("approved", "2026-11-06", "วิชัย หัวหน้า"),
      h("awaiting_payment", "2026-11-06", "สุดา การเงิน"),
      h("paid", "2026-11-07", "สุดา การเงิน", "โอนเข้าบัญชี KB-88213"),
    ],
  },
  {
    id: "EXP-6910-0007", type: "travel", title: "ออกบูธงานแสดงสินค้า", employeeId: "EMP001", employee: "สมชาย ใจดี",
    department: "ฝ่ายขาย", createdAt: "2026-10-10", total: 1850, status: "paid", approver: "วิชัย หัวหน้า",
    payment: { method: "โอนเงิน", ref: "KB-77120", at: "2026-10-15" },
    items: [{ date: "2026-10-09", description: "ค่าน้ำมัน", category: "ค่าน้ำมัน", amount: 1850, receipts: 1 }],
    history: [h("pending", "2026-10-10", "สมชาย ใจดี"), h("approved", "2026-10-11", "วิชัย หัวหน้า"), h("paid", "2026-10-15", "สุดา การเงิน")],
  },
  {
    id: "EXP-6911-0013", type: "travel", title: "ไปอบรม กรุงเทพฯ", employeeId: "EMP002", employee: "มานี รักงาน",
    department: "ฝ่ายการตลาด", createdAt: "2026-11-22", total: 2400, status: "pending", approver: "วิชัย หัวหน้า",
    items: [{ date: "2026-11-21", description: "ตั๋วรถทัวร์ไป-กลับ", category: "อื่น ๆ", amount: 2400, receipts: 2, ocrTotal: 2400 }],
    history: [h("pending", "2026-11-22", "มานี รักงาน")],
  },
  {
    id: "EXP-6911-0008", type: "general", title: "เลี้ยงรับรองลูกค้า", employeeId: "EMP002", employee: "มานี รักงาน",
    department: "ฝ่ายการตลาด", createdAt: "2026-11-03", total: 3200, status: "rejected", approver: "วิชัย หัวหน้า",
    rejectReason: "ไม่มีใบเสร็จรับเงินฉบับจริง",
    items: [{ date: "2026-11-02", description: "อาหารค่ำ", category: "ค่าอาหาร / รับรอง", amount: 3200, receipts: 0, overLimit: true }],
    history: [h("pending", "2026-11-03", "มานี รักงาน"), h("rejected", "2026-11-04", "วิชัย หัวหน้า", "ไม่มีใบเสร็จรับเงินฉบับจริง")],
  },
  {
    id: "EXP-6911-0014", type: "general", title: "ค่าซ่อมเครื่องพิมพ์", employeeId: "EMP003", employee: "ประยุทธ์ ช่างดี",
    department: "ฝ่ายผลิต", createdAt: "2026-11-23", total: 5600, status: "approved", approver: "วิชัย หัวหน้า",
    items: [{ date: "2026-11-22", description: "ซ่อมเครื่องพิมพ์ + อะไหล่", category: "อื่น ๆ", amount: 5600, receipts: 1 }],
    history: [h("pending", "2026-11-23", "ประยุทธ์ ช่างดี"), h("approved", "2026-11-24", "วิชัย หัวหน้า")],
  },
  {
    id: "EXP-6911-0015", type: "travel", title: "ตรวจไซต์งาน ระยอง", employeeId: "EMP003", employee: "ประยุทธ์ ช่างดี",
    department: "ฝ่ายผลิต", createdAt: "2026-11-24", total: 1340, status: "pending", approver: "วิชัย หัวหน้า",
    items: [
      { date: "2026-11-23", description: "ค่าน้ำมัน 160 กม.", category: "ค่าน้ำมัน", amount: 800, receipts: 1 },
      { date: "2026-11-23", description: "ค่าเบี้ยเลี้ยง", category: "ค่าเบี้ยเลี้ยง", amount: 300, receipts: 0 },
      { date: "2026-11-23", description: "ทางด่วน", category: "ค่าทางด่วน / ที่จอดรถ", amount: 240, receipts: 1 },
    ],
    history: [h("pending", "2026-11-24", "ประยุทธ์ ช่างดี")],
  },
  {
    id: "ADV-6911-0002", type: "advance", title: "ยืมเงินจัดกิจกรรมลูกค้า", employeeId: "EMP002", employee: "มานี รักงาน",
    department: "ฝ่ายการตลาด", createdAt: "2026-11-01", total: 5000, status: "clearing", approver: "วิชัย หัวหน้า",
    advanceDueDate: "2026-11-20", advanceActual: 4620, payment: { method: "โอนเงิน", ref: "KB-80011", at: "2026-11-02" },
    items: [
      { date: "2026-11-10", description: "ของที่ระลึก", category: "อื่น ๆ", amount: 2620, receipts: 1 },
      { date: "2026-11-10", description: "ค่าอาหารว่าง", category: "ค่าอาหาร / รับรอง", amount: 2000, receipts: 1 },
    ],
    history: [
      h("pending", "2026-11-01", "มานี รักงาน"),
      h("approved", "2026-11-01", "วิชัย หัวหน้า"),
      h("paid", "2026-11-02", "สุดา การเงิน"),
      h("clearing", "2026-11-19", "มานี รักงาน", "ใช้จริง ฿4,620 คืนเงิน ฿380"),
    ],
  },
  {
    id: "ADV-6910-0001", type: "advance", title: "ยืมเงินซื้ออะไหล่ฉุกเฉิน", employeeId: "EMP003", employee: "ประยุทธ์ ช่างดี",
    department: "ฝ่ายผลิต", createdAt: "2026-10-28", total: 3000, status: "paid", approver: "วิชัย หัวหน้า",
    advanceDueDate: "2026-11-15", payment: { method: "เงินสด", ref: "CASH-031", at: "2026-10-30" },
    items: [{ date: "2026-10-28", description: "อะไหล่เครื่องจักร", category: "อื่น ๆ", amount: 3000, receipts: 0 }],
    history: [h("pending", "2026-10-28", "ประยุทธ์ ช่างดี"), h("approved", "2026-10-29", "วิชัย หัวหน้า"), h("paid", "2026-10-30", "สุดา การเงิน")],
  },
];

/** เงินยืมที่จ่ายแล้วแต่ยังไม่ส่งเคลียร์ */
export const isOpenAdvance = (e: Expense) => e.type === "advance" && e.status === "paid" && !!e.advanceDueDate;

/** ใบกำกับภาษีที่สแกนแล้ว (สำหรับรายงานภาษีซื้อ) — Phase 2 มาจาก expense_items ที่ ocr_verified */
export const VAT_INVOICES = [
  { date: "2026-11-18", docNo: "R6911-004521", vendor: "ปั๊มน้ำมัน ไทยออยล์ สาขาลำปาง", taxId: "0105536000127", expenseId: "EXP-6911-0012", base: 1728.97, vat: 121.03, full: false },
  { date: "2026-11-19", docNo: "INV-2569-11-0088", vendor: "โรงแรมริมปิง เชียงใหม่", taxId: "0505559001231", expenseId: "EXP-6911-0012", base: 2523.36, vat: 176.64, full: true },
  { date: "2026-11-14", docNo: "TX-0099812", vendor: "บริษัท ออฟฟิศเมท จำกัด (มหาชน)", taxId: "0107548000234", expenseId: "EXP-6911-0011", base: 1205.61, vat: 84.39, full: true },
  { date: "2026-11-22", docNo: "SV-661120", vendor: "ร้านซ่อมคอมพิวเตอร์ ไอทีเซอร์วิส", taxId: "3509900123450", expenseId: "EXP-6911-0014", base: 5233.64, vat: 366.36, full: true },
  { date: "2026-11-23", docNo: "ETX-112233", vendor: "การทางพิเศษแห่งประเทศไทย", taxId: "0994000165510", expenseId: "EXP-6911-0015", base: 224.30, vat: 15.70, full: false },
];

/** จำนวนใบเบิก + วันอนุมัติเฉลี่ย รายเดือน (12 เดือน) */
export const MONTHLY_STATS = [
  { m: "ธ.ค.", count: 18, days: 2.4 }, { m: "ม.ค.", count: 21, days: 2.1 }, { m: "ก.พ.", count: 17, days: 1.9 },
  { m: "มี.ค.", count: 26, days: 2.6 }, { m: "เม.ย.", count: 12, days: 1.5 }, { m: "พ.ค.", count: 20, days: 1.8 },
  { m: "มิ.ย.", count: 24, days: 1.6 }, { m: "ก.ค.", count: 29, days: 1.4 }, { m: "ส.ค.", count: 22, days: 1.3 },
  { m: "ก.ย.", count: 33, days: 1.2 }, { m: "ต.ค.", count: 27, days: 1.1 }, { m: "พ.ย.", count: 14, days: 0.9 },
];

/** ยอดเบิกของพนักงานที่ล็อกอิน 6 เดือนล่าสุด */
export const MY_MONTHLY = [
  { m: "มิ.ย.", total: 2400 }, { m: "ก.ค.", total: 5100 }, { m: "ส.ค.", total: 1800 },
  { m: "ก.ย.", total: 6750 }, { m: "ต.ค.", total: 1850 }, { m: "พ.ย.", total: 14460 },
];

/** ยอดจ่ายเงินรายสัปดาห์ (8 สัปดาห์ล่าสุด) */
export const WEEKLY_PAID = [
  { m: "6 ต.ค.", total: 8200 }, { m: "13 ต.ค.", total: 12400 }, { m: "20 ต.ค.", total: 6100 }, { m: "27 ต.ค.", total: 9800 },
  { m: "3 พ.ย.", total: 14300 }, { m: "10 พ.ย.", total: 7600 }, { m: "17 พ.ย.", total: 11200 }, { m: "24 พ.ย.", total: 5400 },
];

export const MONTHLY = [
  { m: "ธ.ค.", travel: 18200, general: 12400, advance: 8000 },
  { m: "ม.ค.", travel: 21000, general: 9800, advance: 0 },
  { m: "ก.พ.", travel: 15800, general: 11200, advance: 5000 },
  { m: "มี.ค.", travel: 24500, general: 14100, advance: 3000 },
  { m: "เม.ย.", travel: 12000, general: 8300, advance: 0 },
  { m: "พ.ค.", travel: 19600, general: 10700, advance: 6000 },
  { m: "มิ.ย.", travel: 22000, general: 12000, advance: 8000 },
  { m: "ก.ค.", travel: 26300, general: 15200, advance: 10000 },
  { m: "ส.ค.", travel: 17100, general: 13100, advance: 8000 },
  { m: "ก.ย.", travel: 30200, general: 18100, advance: 12000 },
  { m: "ต.ค.", travel: 23400, general: 16400, advance: 8000 },
  { m: "พ.ย.", travel: 9390, general: 11060, advance: 13000 },
];
