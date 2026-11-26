// โลโก้เวกเตอร์ (สร้างจาก scripts/build-logo.py → public/brand/*.svg)
/* eslint-disable @next/next/no-img-element -- SVG ขนาดเล็กในโฟลเดอร์ public ไม่ต้องผ่าน Image optimizer */

/** เครื่องหมายอย่างเดียว (สี่เหลี่ยมมุมมน) */
export function BrandMark({ size = 40 }: { size?: number }) {
  return <img src="/brand/logo-mark.svg" alt="EXPENSE เบิกจ่าย" width={size} height={size} className="shrink-0" />;
}

/** โลโก้เต็ม: เครื่องหมาย + EXPENSE เบิกจ่าย + ระบบเบิกค่าใช้จ่าย */
export function BrandLogo({ height = 40, white = false, stacked = false }: { height?: number; white?: boolean; stacked?: boolean }) {
  const src = stacked ? "/brand/logo-stacked.svg" : white ? "/brand/logo-white.svg" : "/brand/logo.svg";
  return <img src={src} alt="EXPENSE เบิกจ่าย — ระบบเบิกค่าใช้จ่าย" style={{ height }} className="w-auto shrink-0" />;
}
