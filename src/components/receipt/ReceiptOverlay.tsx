"use client";

import { FIELD_META, LOW_CONFIDENCE, type Field, type OcrResult } from "@/lib/ocr";

/**
 * รูปใบเสร็จ + กรอบจาก OCR
 * - กรอบเทา = ทุกบรรทัดที่อ่านได้ (เส้นประสีส้ม = ความมั่นใจต่ำ)
 * - กรอบสี = ฟิลด์ที่ระบบดึงไปใช้ (สีตรงกับรายการฟิลด์) · active = กรอบหนาขึ้น
 */
export function ReceiptOverlay({ src, result, fields, active, showAll, onPick }: {
  src: string; result: OcrResult; fields: Field[]; active?: string | null; showAll: boolean; onPick?: (key: string) => void;
}) {
  const owner = new Map<number, Field>();
  fields.forEach((f) => f.lines.forEach((i) => owner.set(i, f)));
  const pts = (box: number[][]) => box.map(([x, y]) => `${x},${y}`).join(" ");
  const sw = Math.max(result.width, result.height) / 380; // ความหนาเส้นตามขนาดรูป

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
      {/* eslint-disable-next-line @next/next/no-img-element -- รูปจากเครื่องผู้ใช้ (blob:) */}
      <img src={src} alt="ใบเสร็จ" className="block h-auto w-full select-none" draggable={false} />
      <svg viewBox={`0 0 ${result.width} ${result.height}`} preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        {result.lines.map((l, i) => {
          const f = owner.get(i);
          if (f) {
            const c = FIELD_META[f.key].color;
            const on = active === f.key;
            const [x, y] = l.box[0];
            return (
              <g key={i} onClick={() => onPick?.(f.key)} className="cursor-pointer">
                <polygon points={pts(l.box)} fill={c} fillOpacity={on ? 0.22 : 0.1} stroke={c} strokeWidth={sw * (on ? 2.2 : 1.3)} />
                <rect x={x} y={y - sw * 9} width={sw * 9} height={sw * 8} rx={sw * 1.5} fill={c} />
                <text x={x + sw * 4.5} y={y - sw * 3} fontSize={sw * 6} fontWeight={700} fill="#fff" textAnchor="middle">
                  {Object.keys(FIELD_META).indexOf(f.key) + 1}
                </text>
              </g>
            );
          }
          if (!showAll) return null;
          const low = l.confidence < LOW_CONFIDENCE;
          return <polygon key={i} points={pts(l.box)} fill="none" stroke={low ? "#f59e0b" : "#94a3b8"} strokeWidth={sw * 0.8} strokeDasharray={low ? `${sw * 3} ${sw * 2}` : undefined} />;
        })}
      </svg>
    </div>
  );
}
