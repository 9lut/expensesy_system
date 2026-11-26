// ผล OCR (รูปแบบเดียวกับ OpenThai2.1-OCR-Text: บรรทัด + กรอบ 4 มุม) และตัวแยกฟิลด์ใบเสร็จ
// ใช้ได้ทั้งผลจาก /api/ocr (Python) และตัวที่จะพอร์ตไปรันในเบราว์เซอร์

export type Point = [number, number];

export interface OcrLine {
  text: string;
  confidence: number;
  /** แถวเดียวกัน = อยู่บรรทัดเดียวกันบนใบเสร็จ (เช่น "รวมทั้งสิ้น" กับ "1,850.00") */
  row: number;
  box: Point[];
}

export interface OcrResult {
  width: number;
  height: number;
  text: string;
  lines: OcrLine[];
  ms?: number;
}

export type FieldKey = "vendor" | "taxId" | "date" | "receiptNo" | "subtotal" | "vat" | "total";

export interface Field {
  key: FieldKey;
  label: string;
  value: string;
  /** index ของบรรทัดที่เป็นที่มาของค่า (ใช้วาดกรอบ) */
  lines: number[];
  confidence: number;
}

export const FIELD_META: Record<FieldKey, { label: string; color: string }> = {
  vendor: { label: "ร้านค้า / ผู้ขาย", color: "#d97706" },
  taxId: { label: "เลขผู้เสียภาษี", color: "#059669" },
  date: { label: "วันที่", color: "#7c3aed" },
  receiptNo: { label: "เลขที่ใบเสร็จ", color: "#0891b2" },
  subtotal: { label: "มูลค่าก่อนภาษี", color: "#0d9488" },
  vat: { label: "ภาษีมูลค่าเพิ่ม (VAT 7%)", color: "#db2777" },
  total: { label: "ยอดรวมทั้งสิ้น", color: "#2563eb" },
};

/** ค่าความมั่นใจต่ำกว่านี้ ให้ผู้ใช้ตรวจเป็นพิเศษ */
export const LOW_CONFIDENCE = 0.9;

const AMOUNT = /(\d{1,3}(?:,\d{3})+|\d+)\.\d{2}(?!\d)/g;
const toNumber = (s: string) => Number(s.replace(/,/g, ""));

/** เลขไทย → เลขอารบิก (โมเดลอาจคืนได้ทั้งสองแบบ) */
const normDigits = (s: string) => s.replace(/[๐-๙]/g, (d) => String(d.charCodeAt(0) - 0x0e50));

function amountsIn(text: string): string[] {
  return normDigits(text).match(AMOUNT) ?? [];
}

/** หายอดเงินที่อยู่ "ในบรรทัดเดียวกัน" กับบรรทัดป้าย (ดูทั้งข้อความตัวเองและบรรทัดอื่นที่ row เดียวกัน) */
function amountInRow(lines: OcrLine[], i: number): { value: string; idx: number[] } | null {
  const own = amountsIn(lines[i].text);
  if (own.length) return { value: own[own.length - 1], idx: [i] };
  const mates = lines.map((l, j) => ({ l, j })).filter(({ l, j }) => j !== i && l.row === lines[i].row);
  for (const { l, j } of mates) {
    const a = amountsIn(l.text);
    if (a.length) return { value: a[a.length - 1], idx: [i, j] };
  }
  return null;
}

function findLabel(lines: OcrLine[], re: RegExp): number[] {
  return lines.map((l, i) => (re.test(normDigits(l.text).replace(/\s+/g, "")) ? i : -1)).filter((i) => i >= 0);
}

const conf = (lines: OcrLine[], idx: number[]) => Math.min(...idx.map((i) => lines[i].confidence));

/**
 * แยกฟิลด์สำคัญจากใบเสร็จไทย
 * - ยอดรวม: ป้าย "รวมทั้งสิ้น / ยอดสุทธิ / ยอดชำระ / Total" แล้วหายอดในแถวเดียวกัน (ป้ายหลังสุดชนะ) → ไม่พบใช้ยอดที่มากที่สุด
 * - วันที่: dd/mm/yyyy (แปลง พ.ศ. → ค.ศ.)
 * - เลขผู้เสียภาษี: ตัวเลข 13 หลัก
 */
export function extractFields(r: OcrResult): Field[] {
  const L = r.lines;
  const out: Field[] = [];
  const push = (key: FieldKey, value: string, idx: number[]) =>
    out.push({ key, label: FIELD_META[key].label, value, lines: idx, confidence: conf(L, idx) });

  // ร้านค้า: บรรทัดแรกที่ไม่ใช่ตัวเลขล้วน
  const v = L.findIndex((l) => /[ก-๙a-zA-Z]{3,}/.test(l.text));
  if (v >= 0) push("vendor", L[v].text.trim(), [v]);

  // เลขผู้เสียภาษี 13 หลัก (อาจมีขีด/ช่องว่างคั่น)
  for (let i = 0; i < L.length; i++) {
    const m = normDigits(L[i].text).replace(/[\s-]/g, "").match(/(?<!\d)\d{13}(?!\d)/);
    if (m) { push("taxId", m[0], [i]); break; }
  }

  // วันที่
  for (let i = 0; i < L.length; i++) {
    const m = normDigits(L[i].text).match(/(?<!\d)(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?!\d)/);
    if (!m) continue;
    let y = Number(m[3]);
    if (y < 100) y += y > 50 ? 2500 : 2000; // 69 → 2569, 26 → 2026
    if (y > 2400) y -= 543; // พ.ศ. → ค.ศ.
    const d = Number(m[1]), mo = Number(m[2]);
    if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) {
      push("date", `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`, [i]);
      break;
    }
  }

  // เลขที่ใบเสร็จ
  for (let i = 0; i < L.length; i++) {
    const m = L[i].text.match(/(?:เลขที่|No\.?|INV|Receipt)\S*\s*[:#]?\s*([A-Z0-9][A-Z0-9/-]{3,})/i);
    if (m) { push("receiptNo", m[1], [i]); break; }
  }

  // มูลค่าก่อนภาษี
  const SUBTOTAL = /มูลค่าสินค้า|มูลค่าก่อนภาษี|ราคาก่อนภาษี|ก่อนภาษี|ก่อนvat|subtotal|sub-total/i;
  for (const i of findLabel(L, SUBTOTAL)) {
    const a = amountInRow(L, i);
    if (a) { push("subtotal", a.value, a.idx); break; }
  }

  // ยอดรวม (ไม่นับบรรทัด "Subtotal" แม้จะมีคำว่า total)
  const totalLabels = findLabel(L, /รวมทั้งสิ้น|ยอดสุทธิ|ยอดชำระ|รวมเงิน|ยอดรวม|grandtotal|nettotal|total/i)
    .filter((i) => !SUBTOTAL.test(L[i].text.replace(/\s+/g, "")));
  let total: { value: string; idx: number[] } | null = null;
  for (const i of [...totalLabels].reverse()) {
    total = amountInRow(L, i);
    if (total) break;
  }
  if (!total) {
    const all = L.flatMap((l, i) => amountsIn(l.text).map((a) => ({ a, i })));
    const best = all.sort((x, y) => toNumber(y.a) - toNumber(x.a))[0];
    if (best) total = { value: best.a, idx: [best.i] };
  }
  if (total) push("total", total.value, total.idx);

  // VAT
  for (const i of findLabel(L, /ภาษีมูลค่าเพิ่ม|vat/i)) {
    const a = amountInRow(L, i);
    if (a) { push("vat", a.value, a.idx); break; }
  }

  return out;
}

export const parseAmount = toNumber;

/* ───────────────────────── จัดหมวดอัตโนมัติ ───────────────────────── */

/** กฎคำสำคัญ → ชื่อหมวด (ตรงกับ categories ในระบบ) — ลำดับสำคัญ: กฎแรกที่ตรงชนะ */
const CATEGORY_RULES: [RegExp, string][] = [
  [/น้ำมัน|แก๊สโซฮอล์|แก๊สโซฮอล|ดีเซล|เบนซิน|e20|e85|ปตท|ptt|บางจาก|bangchak|เชลล์|shell|คาลเท็กซ์|caltex|ไทยออยล์|esso|เอสโซ่|พีที|ซัสโก้|ลิตร/i, "ค่าน้ำมัน"],
  [/ทางพิเศษ|ทางด่วน|มอเตอร์เวย์|easypass|m-pass|mpass|ด่านเก็บเงิน|จอดรถ|parking|ลานจอด/i, "ค่าทางด่วน / ที่จอดรถ"],
  [/โรงแรม|hotel|รีสอร์ท|resort|ห้องพัก|เกสต์เฮาส์|guesthouse|agoda|booking\.com/i, "ค่าที่พัก"],
  [/grab|bolt|lineman|แท็กซี่|taxi|วินมอเตอร์ไซค์|รถรับจ้าง|indrive/i, "ค่าแท็กซี่ / รถรับจ้าง"],
  [/airasia|แอร์เอเชีย|การบินไทย|thaiairways|นกแอร์|nokair|ไทยไลอ้อน|lionair|vietjet|บขส|รถทัวร์|ตั๋วรถไฟ|การรถไฟ|boardingpass|ตั๋วโดยสาร/i, "ค่าตั๋วเดินทาง"],
  [/ไปรษณีย์|thailandpost|kerry|เคอรี่|flash|แฟลช|j&t|ems|ขนส่ง|lalamove|ส่งพัสดุ/i, "ค่าไปรษณีย์ / ขนส่ง"],
  [/\bais\b|true|ทรู|dtac|ดีแทค|อินเทอร์เน็ต|internet|ค่าโทรศัพท์|แพ็กเกจ|เติมเงิน/i, "ค่าโทรศัพท์ / อินเทอร์เน็ต"],
  [/ออฟฟิศ|office|เครื่องเขียน|กระดาษ|หมึก|ปากกา|b2s|ofm|สำนักงาน/i, "วัสดุสำนักงาน"],
  [/ร้านอาหาร|อาหาร|ภัตตาคาร|cafe|คาเฟ่|coffee|กาแฟ|starbucks|amazon|mk|เอ็มเค|บุฟเฟ่ต์|ข้าว|เครื่องดื่ม/i, "ค่าอาหาร / รับรอง"],
];

/** เดาหมวดจากข้อความในใบเสร็จ (คืน null ถ้าไม่มีกฎไหนตรง → ใช้ "อื่น ๆ") */
export function suggestCategory(text: string): string | null {
  const t = text.replace(/\s+/g, "");
  for (const [re, name] of CATEGORY_RULES) if (re.test(t)) return name;
  return null;
}

/* ───────────────────────── ตรวจสอบแบบบัญชี ───────────────────────── */

/** เลขประจำตัวผู้เสียภาษี 13 หลัก: หลักสุดท้ายคือ check digit (mod 11) */
export function taxIdValid(id: string): boolean {
  const d = id.replace(/\D/g, "");
  if (d.length !== 13) return false;
  let s = 0;
  for (let i = 0; i < 12; i++) s += Number(d[i]) * (13 - i);
  return (11 - (s % 11)) % 10 === Number(d[12]);
}

export type DocType = "full_tax_invoice" | "abb_tax_invoice" | "receipt" | "unknown";
export const DOC_TYPE_LABEL: Record<DocType, string> = {
  full_tax_invoice: "ใบกำกับภาษีเต็มรูป",
  abb_tax_invoice: "ใบกำกับภาษีอย่างย่อ",
  receipt: "ใบเสร็จรับเงิน",
  unknown: "ไม่ทราบประเภท",
};

/** จำแนกประเภทเอกสาร (ทนต่อการอ่านเพี้ยนเล็กน้อย เช่น "ใบกำากับ") */
export function detectDocType(text: string): DocType {
  const t = text.replace(/\s+/g, "");
  const tax = /กับภาษี|taxinvoice/i.test(t);
  if (tax && /อย่างย่อ|abb/i.test(t)) return "abb_tax_invoice";
  if (tax) return "full_tax_invoice";
  if (/ใบเสร็จ|receipt/i.test(t)) return "receipt";
  return "unknown";
}

export type CheckStatus = "ok" | "warn" | "fail" | "info";
export interface Check { id: string; label: string; status: CheckStatus; detail: string }

const n2 = (v?: string) => (v && !Number.isNaN(Number(v)) && v.trim() !== "" ? Number(v) : undefined);
const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * รายการตรวจความถูกต้องของใบเสร็จ (คำนวณใหม่ทุกครั้งที่ผู้ใช้แก้ค่า)
 * values: ค่าที่ผู้ใช้ยืนยันแล้ว (ยอดเงินเป็นตัวเลขไม่มีจุลภาค, วันที่ YYYY-MM-DD)
 */
export function checkReceipt(values: Partial<Record<FieldKey, string>>, docType: DocType, today: string, maxAgeDays = 90): Check[] {
  const out: Check[] = [];
  const total = n2(values.total), vat = n2(values.vat), sub = n2(values.subtotal);

  // 1) เลขผู้เสียภาษี
  const id = (values.taxId ?? "").replace(/\D/g, "");
  if (!id) out.push({ id: "tax", label: "เลขผู้เสียภาษี 13 หลัก", status: docType === "receipt" ? "info" : "warn", detail: "ไม่พบในเอกสาร" });
  else if (taxIdValid(id)) out.push({ id: "tax", label: "เลขผู้เสียภาษี 13 หลัก", status: "ok", detail: "ตรวจหลักสุดท้ายถูกต้อง" });
  else out.push({ id: "tax", label: "เลขผู้เสียภาษี 13 หลัก", status: "fail", detail: id.length !== 13 ? `มี ${id.length} หลัก` : "หลักตรวจสอบไม่ถูกต้อง อาจอ่านผิดหรือเลขไม่จริง" });

  // 2) VAT 7%
  if (vat !== undefined) {
    const base = sub ?? (total !== undefined ? total - vat : undefined);
    if (base !== undefined) {
      const expect = Math.round(base * 0.07 * 100) / 100;
      const okVat = Math.abs(expect - vat) <= 1;
      out.push({ id: "vat", label: "VAT = 7% ของมูลค่าก่อนภาษี", status: okVat ? "ok" : "warn", detail: okVat ? `${fmt(base)} × 7% = ${fmt(expect)}` : `ควรเป็น ${fmt(expect)} แต่อ่านได้ ${fmt(vat)}` });
    }
  } else if (docType === "full_tax_invoice" || docType === "abb_tax_invoice") {
    out.push({ id: "vat", label: "VAT = 7% ของมูลค่าก่อนภาษี", status: "warn", detail: "เป็นใบกำกับภาษีแต่ไม่พบยอด VAT" });
  }

  // 3) มูลค่าก่อนภาษี + VAT = ยอดรวม
  if (sub !== undefined && vat !== undefined && total !== undefined) {
    const sum = Math.round((sub + vat) * 100) / 100;
    const okSum = Math.abs(sum - total) < 0.01;
    out.push({ id: "sum", label: "มูลค่าก่อนภาษี + VAT = ยอดรวม", status: okSum ? "ok" : "fail", detail: okSum ? `${fmt(sub)} + ${fmt(vat)} = ${fmt(total)}` : `${fmt(sub)} + ${fmt(vat)} = ${fmt(sum)} ไม่เท่ากับ ${fmt(total)}` });
  }

  // 4) วันที่
  if (!values.date) out.push({ id: "date", label: "วันที่ในเอกสาร", status: "warn", detail: "ไม่พบวันที่" });
  else {
    const age = Math.round((new Date(today).getTime() - new Date(values.date).getTime()) / 86_400_000);
    if (age < 0) out.push({ id: "date", label: "วันที่ในเอกสาร", status: "fail", detail: "เป็นวันในอนาคต" });
    else if (age > maxAgeDays) out.push({ id: "date", label: "วันที่ในเอกสาร", status: "warn", detail: `เก่า ${age} วัน (เกิน ${maxAgeDays} วัน)` });
    else out.push({ id: "date", label: "วันที่ในเอกสาร", status: "ok", detail: age === 0 ? "วันนี้" : `${age} วันที่แล้ว` });
  }

  // 5) ประเภทเอกสาร → สิทธิ์ขอคืน VAT
  out.push({
    id: "doc", label: `ประเภท: ${DOC_TYPE_LABEL[docType]}`, status: "info",
    detail: docType === "full_tax_invoice" ? "ใช้ขอคืนภาษีซื้อได้"
      : docType === "abb_tax_invoice" ? "ขอคืนภาษีซื้อไม่ได้ (ฉบับย่อ) — บันทึกเป็นค่าใช้จ่ายรวม VAT"
      : "ไม่ใช่ใบกำกับภาษี — บันทึกเป็นค่าใช้จ่ายรวม VAT",
  });
  return out;
}
