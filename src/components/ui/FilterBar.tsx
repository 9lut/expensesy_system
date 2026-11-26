"use client";

// พอร์ตจาก ikuwah-test/src/components/ui/FilterBar.tsx (หน้าตา/พฤติกรรมเดียวกัน)
// เพิ่ม: summary (แสดงทางขวาของแถว "พบ N รายการ" เช่น ยอดรวม)
import { useEffect, useState, type ReactNode } from "react";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react";

function bangkokToday() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function addDays(value: string, offset: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
function displayDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("th-TH", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00Z`));
}
function monthLabel(value: string) {
  return new Intl.DateTimeFormat("th-TH", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(`${value}-01T12:00:00Z`));
}
function shiftMonth(value: string, offset: number) {
  const date = new Date(`${value}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

const QUICK_RANGES = [["7 วัน", 7], ["30 วัน", 30], ["90 วัน", 90]] as const;

export type FilterOption = { value: string; label: string };

export type FilterFacet = {
  id: string;
  label: string;
  type?: "checkbox" | "dateRange";
  options?: FilterOption[];
  /** checkbox = ค่าที่เลือก · dateRange = [from, to] (YYYY-MM-DD) */
  selected: string[];
  onChange: (values: string[]) => void;
};

/** ตรงกับช่วงวันที่ของ facet แบบ dateRange หรือไม่ (ไม่ได้เลือก = ผ่าน) */
export function inDateRange(date: string, range: string[]) {
  const [from, to] = range;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function FilterBar({
  searchValue, onSearchChange, searchPlaceholder = "ค้นหา...", facets, totalItems, itemNoun = "รายการ", summary, actionButtons,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  facets: FilterFacet[];
  totalItems: number;
  itemNoun?: string;
  summary?: ReactNode;
  actionButtons?: ReactNode;
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openFacet, setOpenFacet] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => bangkokToday().slice(0, 7));

  useEffect(() => {
    if (!openFacet) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpenFacet(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openFacet]);

  const countOf = (f: FilterFacet) => (f.type === "dateRange" ? (f.selected[0] || f.selected[1] ? 1 : 0) : f.selected.length);
  const totalSelectedCount = facets.reduce((acc, f) => acc + countOf(f), 0);
  const hasAnyFilter = totalSelectedCount > 0;
  const clearAllFilters = () => { facets.forEach((f) => f.onChange([])); setOpenFacet(null); };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      {/* แถวบน: ค้นหา + ตัวกรอง (+ ปุ่มอื่น) */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:flex-1">
          <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 shadow-sm transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 sm:px-4">
            <Search size={18} className="shrink-0 text-slate-400" />
            <input type="text" value={searchValue} onChange={(e) => onSearchChange(e.target.value)} placeholder={searchPlaceholder}
              className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-400 sm:text-sm" />
            {searchValue && <button aria-label="ล้างคำค้นหา" onClick={() => onSearchChange("")} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>}
          </div>
          <button onClick={() => setIsFilterOpen(!isFilterOpen)} aria-expanded={isFilterOpen}
            className={`flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3 font-bold shadow-sm transition-all sm:px-4 ${
              isFilterOpen || hasAnyFilter ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            <Filter size={18} />
            <span className="hidden text-xs sm:block">ตัวกรอง</span>
            {hasAnyFilter && <span className="flex size-5 items-center justify-center rounded-md bg-blue-600 text-[10px] font-bold text-white">{totalSelectedCount}</span>}
          </button>
        </div>
        {actionButtons && <div className="flex flex-wrap items-center gap-2">{actionButtons}</div>}
      </div>

      {openFacet && <div className="fixed inset-0 z-30" onClick={() => setOpenFacet(null)} />}

      {/* แผงตัวกรอง */}
      {isFilterOpen && (
        <div className="relative z-40 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-3">
          <button type="button" onClick={clearAllFilters}
            className={`inline-flex min-h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-[12px] font-bold transition-all sm:px-4 sm:text-[13px] ${
              !hasAnyFilter ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50"}`}>
            <Check size={16} /> ทั้งหมด
          </button>

          {facets.map((facet) => {
            const n = countOf(facet);
            const open = openFacet === facet.id;
            return (
              <div key={facet.id} className="relative">
                <button type="button" onClick={(e) => { e.stopPropagation(); setOpenFacet(open ? null : facet.id); }}
                  className={`inline-flex min-h-[38px] shrink-0 items-center justify-between gap-2 rounded-lg border px-3 text-[12px] font-bold transition-all sm:px-4 sm:text-[13px] ${
                    n > 0 || open ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500" : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50"}`}>
                  <span className="flex items-center gap-2">
                    {facet.type === "dateRange" && <CalendarDays size={15} />}
                    {facet.label}
                    {n > 0 && <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-md bg-blue-600 px-1 text-[10.5px] font-bold leading-none text-white">{n}</span>}
                  </span>
                  <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {open && (
                  <div onClick={(e) => e.stopPropagation()}
                    className={`absolute left-0 top-[calc(100%+0.5rem)] z-40 rounded-xl border border-slate-200 bg-white p-2 shadow-xl ${facet.type === "dateRange" ? "w-[min(360px,90vw)] p-3" : "w-60"}`}>
                    {facet.type === "dateRange" ? (() => {
                      const from = facet.selected[0] || "";
                      const to = facet.selected[1] || "";
                      const setQuickRange = (days: number) => {
                        const today = bangkokToday();
                        const f = addDays(today, 1 - days);
                        facet.onChange([f, today]);
                        setCalendarMonth(f.slice(0, 7));
                      };
                      const setThisMonth = () => {
                        const first = `${bangkokToday().slice(0, 7)}-01`;
                        facet.onChange([first, addDays(`${shiftMonth(first.slice(0, 7), 1)}-01`, -1)]);
                        setCalendarMonth(first.slice(0, 7));
                      };
                      const selectDay = (day: string) => {
                        if (!from || to) facet.onChange([day, ""]);
                        else if (day < from) facet.onChange([day, from]);
                        else facet.onChange([from, day]);
                      };
                      const firstDay = new Date(`${calendarMonth}-01T12:00:00Z`);
                      const gridStart = addDays(`${calendarMonth}-01`, -firstDay.getUTCDay());
                      const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
                      return (
                        <div>
                          <div className="mb-4 grid grid-cols-2 gap-3">
                            {[["เริ่มต้น", from], ["สิ้นสุด", to]].map(([label, v]) => (
                              <div key={label} className="grid gap-2 text-xs font-semibold text-slate-500">{label}
                                <div className="flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-800">
                                  <span className={v ? "" : "text-slate-400"}>{v ? displayDate(v) : "ระบุในปฏิทิน"}</span>
                                  <CalendarDays size={14} className="shrink-0 text-slate-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mb-4 grid grid-cols-4 gap-2 border-b border-slate-100 pb-4">
                            {QUICK_RANGES.map(([label, d]) => (
                              <button type="button" key={label} onClick={() => setQuickRange(d)} className="h-8 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:border-blue-400 hover:bg-blue-50">{label}</button>
                            ))}
                            <button type="button" onClick={setThisMonth} className="h-8 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:border-blue-400 hover:bg-blue-50">เดือนนี้</button>
                          </div>
                          <div className="mb-3 flex items-center justify-between">
                            <button type="button" onClick={() => facet.onChange([])} className="text-[12px] font-bold text-amber-600 hover:text-amber-700">ล้าง</button>
                            <button type="button" onClick={() => setQuickRange(1)} className="text-[12px] font-bold text-amber-600 hover:text-amber-700">วันนี้</button>
                          </div>
                          <div className="mb-3 flex items-center justify-between">
                            <button type="button" onClick={() => setCalendarMonth(shiftMonth(calendarMonth, -1))} aria-label="เดือนก่อนหน้า" className="grid size-8 place-items-center rounded-full text-slate-700 hover:bg-slate-100"><ChevronLeft size={18} /></button>
                            <strong className="text-[14px] font-bold text-slate-800">{monthLabel(calendarMonth)}</strong>
                            <button type="button" onClick={() => setCalendarMonth(shiftMonth(calendarMonth, 1))} aria-label="เดือนถัดไป" className="grid size-8 place-items-center rounded-full text-slate-700 hover:bg-slate-100"><ChevronRight size={18} /></button>
                          </div>
                          <div className="mb-2 grid grid-cols-7 text-center text-[12px] font-bold text-slate-500">
                            {["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."].map((d) => <span key={d} className="py-1">{d}</span>)}
                          </div>
                          <div className="grid grid-cols-7 gap-y-1 text-center">
                            {days.map((day) => {
                              const active = day === from || day === to;
                              const inRange = from && to && day > from && day < to;
                              return (
                                <button type="button" key={day} onClick={() => selectDay(day)}
                                  className={`mx-auto grid size-8 place-items-center rounded-full text-[12px] font-bold transition-all ${
                                    active ? "bg-slate-800 text-white shadow-md" : inRange ? "bg-slate-100 text-slate-800" : day.slice(0, 7) === calendarMonth ? "text-slate-800 hover:bg-slate-100" : "text-slate-300 hover:bg-slate-100"}`}>
                                  {Number(day.slice(-2))}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })() : (
                      <>
                        {(facet.options ?? []).length > 0 ? (facet.options ?? []).map((opt) => (
                          <label key={opt.value} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50">
                            <input type="checkbox" checked={facet.selected.includes(opt.value)}
                              onChange={() => facet.onChange(facet.selected.includes(opt.value) ? facet.selected.filter((v) => v !== opt.value) : [...facet.selected, opt.value])}
                              className="size-4 accent-blue-600" />
                            {opt.label}
                          </label>
                        )) : <p className="px-3 py-3 text-[13px] text-slate-500">ไม่มีตัวเลือก</p>}
                        {facet.selected.length > 0 && (
                          <button type="button" onClick={() => facet.onChange([])} className="mt-2 w-full rounded-lg bg-slate-50 py-2 text-[12px] font-bold text-slate-500 hover:bg-slate-100">ล้างตัวเลือก</button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {hasAnyFilter && (
            <button type="button" onClick={clearAllFilters} className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-[12px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700">
              <X size={14} /> ล้างตัวกรอง
            </button>
          )}
        </div>
      )}

      {/* แถวผลลัพธ์: พบ N รายการ · แท็กตัวกรอง · สรุปทางขวา */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-1 pt-3">
        <span className="mr-1 text-[12px] font-bold text-slate-500">พบ <b className="text-slate-800">{totalItems.toLocaleString()}</b> {itemNoun}</span>
        {facets.map((facet) => {
          if (facet.type === "dateRange") {
            const [f, t] = facet.selected;
            if (!f && !t) return null;
            const label = f && t ? `${displayDate(f)} - ${displayDate(t)}` : displayDate(f || t);
            return (
              <span key={facet.id} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                {facet.label}: {label}
                <button type="button" aria-label={`ล้าง ${facet.label}`} onClick={() => facet.onChange([])} className="hover:text-blue-900"><X size={12} /></button>
              </span>
            );
          }
          return facet.selected.map((val) => {
            const opt = (facet.options ?? []).find((o) => o.value === val);
            return (
              <span key={`${facet.id}-${val}`} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                {facet.label}: {opt ? opt.label : val}
                <button type="button" aria-label={`เอา ${opt?.label ?? val} ออก`} onClick={() => facet.onChange(facet.selected.filter((v) => v !== val))} className="hover:text-blue-900"><X size={12} /></button>
              </span>
            );
          });
        })}
        {hasAnyFilter && <button type="button" onClick={clearAllFilters} className="ml-1 text-[11px] font-bold text-slate-400 hover:text-slate-600">ล้างทั้งหมด</button>}
        {summary && <span className="ml-auto text-[12px] text-slate-500">{summary}</span>}
      </div>
    </div>
  );
}
