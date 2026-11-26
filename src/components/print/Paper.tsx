/* eslint-disable @next/next/no-img-element -- โลโก้ SVG ในเอกสารพิมพ์ */
import type { ReactNode } from "react";
import { COMPANY } from "@/lib/company";

/** กระดาษ A4 (210 × 297 มม.) · ขอบซ้าย 3 ซม. ขวา 2 ซม. ตามแบบหนังสือราชการ */
export function Paper({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <article style={{ fontFamily: "var(--font-sarabun), serif" }}
      className={`sheet relative mx-auto box-border flex h-[297mm] w-[210mm] flex-col overflow-hidden bg-white py-[18mm] pl-[25mm] pr-[18mm] text-[12pt] leading-[1.45] text-black shadow-[0_2px_24px_rgba(15,23,42,.12)] print:shadow-none ${className}`}>
      {children}
    </article>
  );
}

/** ค่าที่กรอกบนเส้นประ (inline) */
export function Dot({ children, w, center = true, className = "" }: { children?: ReactNode; w?: string; center?: boolean; className?: string }) {
  return (
    <span className={`inline-block border-b border-dotted border-black px-1 align-baseline leading-[1.25] ${center ? "text-center" : ""} ${className}`} style={{ minWidth: w }}>
      {children ?? " "}
    </span>
  );
}

/** แถวป้าย + ค่าบนเส้นประยาวเต็มบรรทัด */
export function Line({ label, children, after }: { label: ReactNode; children?: ReactNode; after?: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0">{label}</span>
      <span className="min-w-0 flex-1 border-b border-dotted border-black px-1 leading-[1.25]">{children ?? " "}</span>
      {after}
    </div>
  );
}

/** ช่องติ๊ก ☐ / ☑ */
export function Box({ checked = false, children }: { checked?: boolean; children: ReactNode }) {
  return (
    <span className="mr-5 inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="relative top-[2px] inline-grid size-[9pt] place-items-center border border-black text-[8.5pt] leading-none">{checked ? "✓" : ""}</span>
      {children}
    </span>
  );
}

/** ลายมือชื่อ: ลงชื่อ......(ชื่อ)......ตำแหน่ง/วันที่ */
export function Sign({ role, name, position, date, className = "" }: { role: string; name?: string; position?: string; date?: string; className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <p className="whitespace-nowrap">ลงชื่อ<Dot w="44mm" />{role}</p>
      <p>( <Dot w="44mm">{name}</Dot> )</p>
      {position !== undefined && <p className="whitespace-nowrap">ตำแหน่ง <Dot w="40mm">{position}</Dot></p>}
      <p className="whitespace-nowrap">วันที่ <Dot w="40mm">{date}</Dot></p>
    </div>
  );
}

/** หัวกระดาษบริษัท (ใช้กับแบบฟอร์มบัญชี) */
export function Letterhead({ title, subtitle, no }: { title: string; subtitle?: string; no?: ReactNode }) {
  return (
    <header className="mb-[5mm]">
      <div className="flex items-start gap-[4mm] border-b-2 border-black pb-[3mm]">
        <img src="/brand/logo-mark.svg" alt="" className="size-[16mm] grayscale" />
        <div className="min-w-0 flex-1 text-[10pt] leading-snug">
          <p className="text-[12pt] font-bold">{COMPANY.name}</p>
          <p>{COMPANY.address}</p>
          <p>โทร {COMPANY.phone} · เลขประจำตัวผู้เสียภาษี {COMPANY.taxId} ({COMPANY.branch})</p>
        </div>
        {no && <div className="shrink-0 text-right text-[10pt]">{no}</div>}
      </div>
      <h1 className="mt-[4mm] text-center text-[16pt] font-bold leading-tight">{title}</h1>
      {subtitle && <p className="text-center text-[10.5pt]">{subtitle}</p>}
    </header>
  );
}

/** ตารางแบบฟอร์ม (เส้นดำ) */
export const tbl = "w-full border-collapse text-[10.5pt] [&_td]:border [&_td]:border-black [&_td]:px-[2mm] [&_td]:py-[1mm] [&_th]:border [&_th]:border-black [&_th]:px-[2mm] [&_th]:py-[1mm] [&_th]:font-bold";

/** ท้ายกระดาษ: อ้างอิงเลขที่เอกสารในระบบ */
export function Footer({ refNo }: { refNo: string }) {
  return (
    <footer className="mt-auto flex justify-between border-t border-black/40 pt-[2mm] text-[8.5pt] text-black/60">
      <span>พิมพ์จากระบบเบิกค่าใช้จ่าย · อ้างอิง {refNo}</span>
      <span>{COMPANY.name}</span>
    </footer>
  );
}
