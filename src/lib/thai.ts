// ตัวช่วยสำหรับเอกสารภาษาไทย: อ่านจำนวนเงินเป็นตัวอักษร วันที่แบบเต็ม ตัวเลขไทย

const DIGIT = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const POS = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

/** อ่านเลขไม่เกิน 6 หลัก · hasHigher = มีหลักล้านนำหน้า (เลข 1 หลักหน่วยอ่าน "เอ็ด") */
function read6(digits: string, hasHigher: boolean): string {
  const s = digits.replace(/^0+/, "");
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const d = +s[i];
    const pos = s.length - i - 1;
    if (d === 0) continue;
    let w = DIGIT[d];
    if (pos === 0 && d === 1 && (s.length > 1 || hasHigher)) w = "เอ็ด";
    else if (pos === 1 && d === 2) w = "ยี่";
    else if (pos === 1 && d === 1) w = "";
    out += w + POS[pos];
  }
  return out;
}

function readInt(digits: string): string {
  const s = digits.replace(/^0+/, "");
  if (!s) return "";
  if (s.length <= 6) return read6(s, false);
  const high = s.slice(0, -6);
  return readInt(high) + "ล้าน" + read6(s.slice(-6), true);
}

/** 1850.5 → "หนึ่งพันแปดร้อยห้าสิบบาทห้าสิบสตางค์" */
export function bahtText(n: number): string {
  const [b, st] = Math.abs(n).toFixed(2).split(".");
  const baht = readInt(b);
  const satang = readInt(st);
  if (!baht && !satang) return "ศูนย์บาทถ้วน";
  return (baht ? `${baht}บาท` : "") + (satang ? `${satang}สตางค์` : "ถ้วน");
}

/** "2026-11-25" → "25 พฤศจิกายน 2569" */
export const thDateLong = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });

/** 1850 → "1,850.00" */
export const money = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
