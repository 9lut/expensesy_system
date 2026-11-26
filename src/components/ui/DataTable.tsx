"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { tdCls, thCls } from "./table-styles";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** ค่าที่ใช้เรียงลำดับ — ไม่ใส่ = คอลัมน์นี้เรียงไม่ได้ */
  sort?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  className?: string;
};

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

/** เลขหน้าที่จะแสดง (เช่น 1 … 4 5 6 … 12) */
function pageList(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);
  if (from > 2) out.push("…");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < pages - 1) out.push("…");
  out.push(pages);
  return out;
}

/**
 * ตารางกลางของระบบ (แบบ Zebra)
 * - หัวตารางกดเรียงลำดับได้ ↑↓ · แถวสลับสี · เลือกหลายแถว · คลิกแถว
 * - แบ่งหน้า: เลือกจำนวนแถวต่อหน้า + ปุ่ม แรก / ก่อนหน้า / เลขหน้า / ถัดไป / สุดท้าย
 */
export function DataTable<T>({
  rows, columns, rowKey, onRowClick, activeKey, selection, empty, minWidth = 720,
  pageSizeOptions = [10, 20, 50], defaultPageSize = 10,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  activeKey?: string;
  selection?: { selected: string[]; onChange: (keys: string[]) => void };
  empty?: string;
  minWidth?: number;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageState, setPage] = useState(1);

  if (rows.length === 0) return <EmptyState text={empty} />;

  const col = columns.find((c) => c.key === sortKey);
  const sorted = col?.sort
    ? [...rows].sort((a, b) => {
        const x = col.sort!(a);
        const y = col.sort!(b);
        return (x < y ? -1 : x > y ? 1 : 0) * dir;
      })
    : rows;

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(pageState, pages); // ข้อมูลลดลง (เช่น กรอง) → ไม่ค้างหน้าที่ไม่มีแล้ว
  const start = (page - 1) * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  const clickSort = (key: string) => {
    if (sortKey === key) setDir(dir === 1 ? -1 : 1);
    else { setSortKey(key); setDir(1); }
  };

  const keys = visible.map(rowKey);
  const sel = selection?.selected ?? [];
  const allOn = keys.length > 0 && keys.every((k) => sel.includes(k));
  const toggle = (k: string) => selection?.onChange(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k]);
  const toggleAll = () => selection?.onChange(allOn ? sel.filter((k) => !keys.includes(k)) : [...new Set([...sel, ...keys])]);

  const navBtn = "grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth }}>
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {selection && (
                <th className="w-12 pl-5">
                  <input type="checkbox" aria-label="เลือกทั้งหน้า" checked={allOn} onChange={toggleAll} className="size-4 accent-blue-600" />
                </th>
              )}
              {columns.map((c) => {
                const Icon = sortKey !== c.key ? ArrowUpDown : dir === 1 ? ArrowUp : ArrowDown;
                return (
                  <th key={c.key} className={`${thCls} ${ALIGN[c.align ?? "left"]} ${c.className ?? ""}`} aria-sort={sortKey === c.key ? (dir === 1 ? "ascending" : "descending") : undefined}>
                    {c.sort ? (
                      <button onClick={() => clickSort(c.key)} className={`inline-flex items-center gap-1.5 hover:text-slate-900 ${c.align === "right" ? "flex-row-reverse" : ""}`}>
                        {c.header}
                        <Icon size={14} className={sortKey === c.key ? "text-blue-600" : "text-slate-300"} />
                      </button>
                    ) : c.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {visible.map((r, i) => {
              const k = rowKey(r);
              const bg = activeKey === k ? "bg-blue-50" : sel.includes(k) ? "bg-blue-50/60" : i % 2 ? "bg-slate-50/70 hover:bg-slate-100/70" : "bg-white hover:bg-slate-50";
              return (
                <tr key={k}
                  // คลิกได้ทั้งแถว ยกเว้นเมื่อคลิกโดนปุ่ม/ลิงก์/ช่องกรอกภายในแถว
                  onClick={onRowClick ? (ev) => { if (!(ev.target as HTMLElement).closest("button,a,input,select,label,textarea")) onRowClick(r); } : undefined}
                  className={`transition-colors ${onRowClick ? "cursor-pointer" : ""} ${bg}`}>
                  {selection && (
                    <td className="pl-5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" aria-label={`เลือก ${k}`} checked={sel.includes(k)} onChange={() => toggle(k)} className="size-4 accent-blue-600" />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} className={`${tdCls} ${ALIGN[c.align ?? "left"]} ${c.className ?? ""}`}>{c.cell(r)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* แถบแบ่งหน้า */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-sm">
        <label className="flex items-center gap-2 text-slate-500">
          แสดง
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100">
            {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          รายการต่อหน้า
        </label>
        <div className="flex items-center gap-3">
          <span className="text-slate-500">
            <b className="text-slate-800">{start + 1}–{Math.min(start + pageSize, sorted.length)}</b> จาก <b className="text-slate-800">{sorted.length}</b>
          </span>
          <nav className="flex items-center gap-1" aria-label="แบ่งหน้า">
            <button className={navBtn} disabled={page === 1} onClick={() => setPage(1)} aria-label="หน้าแรก"><ChevronsLeft size={16} /></button>
            <button className={navBtn} disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="หน้าก่อนหน้า"><ChevronLeft size={16} /></button>
            {pageList(page, pages).map((p, i) =>
              p === "…" ? <span key={`e${i}`} className="px-1 text-slate-400">…</span> : (
                <button key={p} onClick={() => setPage(p)} aria-current={p === page ? "page" : undefined}
                  className={`h-9 min-w-9 rounded-lg px-2 font-bold transition ${p === page ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {p}
                </button>
              ))}
            <button className={navBtn} disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="หน้าถัดไป"><ChevronRight size={16} /></button>
            <button className={navBtn} disabled={page === pages} onClick={() => setPage(pages)} aria-label="หน้าสุดท้าย"><ChevronsRight size={16} /></button>
          </nav>
        </div>
      </div>
    </div>
  );
}
