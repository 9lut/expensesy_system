import type { Metadata } from "next";
import { Sarabun } from "next/font/google";

/** Sarabun = ฟอนต์ตระกูลเดียวกับ TH Sarabun ที่ใช้ในหนังสือราชการ */
const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["latin", "thai"],
  weight: ["400", "700"],
});

export const metadata: Metadata = { title: "แบบฟอร์มเอกสาร · ระบบเบิกค่าใช้จ่าย" };

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${sarabun.variable} min-h-dvh bg-slate-200/70 print:bg-white`}>{children}</div>;
}
