// Zod schema ของข้อมูลที่รับเข้า API (แผนข้อ 19) — ใช้ได้ทั้งฝั่ง Client และ Server
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD");

/** ยอดเงิน > 0 ทศนิยมไม่เกิน 2 ตำแหน่ง */
export const money = z
  .number({ error: "จำนวนเงินต้องเป็นตัวเลข" })
  .positive("จำนวนเงินต้องมากกว่า 0")
  .max(10_000_000, "จำนวนเงินสูงเกินไป")
  .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, "ทศนิยมไม่เกิน 2 ตำแหน่ง");

export const ItemInput = z.object({
  date: isoDate,
  description: z.string().trim().min(1, "กรอกรายละเอียด").max(200),
  category: z.string().min(1, "เลือกหมวด"),
  amount: money,
  receiptIds: z.array(z.string().min(1)).max(10).default([]),
  ocrTotal: z.number().nonnegative().optional(),
  origin: z.string().max(100).optional(),
  destination: z.string().max(100).optional(),
  travelMode: z.enum(["รถส่วนตัว", "รถสาธารณะ", "เครื่องบิน", "แท็กซี่"]).optional(),
  distanceKm: z.number().nonnegative().max(5000).optional(),
});
export type ItemInput = z.infer<typeof ItemInput>;

/** สร้าง / แก้ไขใบเบิก */
export const ExpenseInput = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("expense"),
    /** ไม่ระบุ = ระบบเลือกจากหมวด (มีหมวดค่าเดินทาง → travel) */
    type: z.enum(["travel", "general"]).optional(),
    title: z.string().trim().min(1, "กรอกหัวข้อ").max(150),
    purpose: z.string().trim().max(300).optional(),
    items: z.array(ItemInput).min(1, "ต้องมีอย่างน้อย 1 รายการ").max(50),
    submit: z.boolean().default(true),
  }),
  z.object({
    kind: z.literal("advance"),
    title: z.string().trim().min(1, "กรอกวัตถุประสงค์").max(150),
    amount: money,
    neededDate: isoDate,
    note: z.string().trim().max(300).optional(),
    submit: z.boolean().default(true),
  }),
]);
export type ExpenseInput = z.infer<typeof ExpenseInput>;

/** ข้อมูลประกอบการเปลี่ยนสถานะ (ตาม action) */
export const NoteInput = z.object({ note: z.string().trim().max(500).optional() });

export const PayInput = z.object({
  method: z.enum(["โอนเงิน", "เงินสด", "เช็ค"]),
  ref: z.string().trim().min(1, "กรอกเลขอ้างอิง").max(60),
  at: isoDate.optional(),
  slipId: z.string().optional(),
  note: z.string().trim().max(500).optional(),
});

export const ClearInput = z.object({
  items: z.array(ItemInput).min(1, "ต้องมีอย่างน้อย 1 รายการ").max(50),
  refundSlipId: z.string().optional(),
  note: z.string().trim().max(500).optional(),
});

export const ListQuery = z.object({
  status: z.string().optional(),
  type: z.enum(["travel", "general", "advance"]).optional(),
  employeeId: z.string().optional(),
  mine: z.enum(["1", "0"]).optional(),
});
