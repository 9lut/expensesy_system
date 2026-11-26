"use client";

// กราฟกลางของระบบ — โทนน้ำเงินเดียว (เข้ม → อ่อน) ใช้สีน้อยตามแนวทางหน้าคอม
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const BLUES = ["#1d4ed8", "#3b82f6", "#93c5fd", "#cbd5e1", "#64748b"];
const GRID = "#e2e8f0";
const tick = { fontSize: 12, fill: "#64748b" };
const money = (v: unknown) => `${Number(v).toLocaleString("th-TH")} บาท`;
const k = (v: number) => (v >= 1000 ? `${v / 1000}k` : String(v));

/** โดนัทสัดส่วน + ตัวเลขรวมตรงกลาง + คำอธิบายด้านข้าง */
export function DonutChart({ data, centerLabel }: { data: { name: string; value: number }[]; centerLabel: string }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  return (
    <div className="flex items-center gap-4">
      <div className="relative size-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="100%" paddingAngle={2} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={BLUES[i % BLUES.length]} />)}
            </Pie>
            <Tooltip formatter={money} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] text-slate-500">{centerLabel}</p>
            <p className="text-sm font-bold tabular-nums">{total.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: BLUES[i % BLUES.length] }} />
            <span className="min-w-0 flex-1 truncate text-slate-600">{d.name}</span>
            <span className="font-bold tabular-nums">{((d.value / total) * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** แท่งเดี่ยว (ยอดเงินตามช่วงเวลา) */
export function SimpleBars({ data, height = 200, highlightLast = true }: { data: { m: string; total: number }[]; height?: number; highlightLast?: boolean }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
          <XAxis dataKey="m" tickLine={false} axisLine={false} tick={tick} />
          <YAxis tickLine={false} axisLine={false} width={36} tick={tick} tickFormatter={k} />
          <Tooltip cursor={{ fill: "#eff6ff" }} formatter={money} />
          <Bar dataKey="total" name="ยอดเงิน" radius={[5, 5, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={highlightLast && i === data.length - 1 ? "#1d4ed8" : "#93c5fd"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** จำนวนใบเบิก (พื้นที่) + วันอนุมัติเฉลี่ย (เส้น) */
export function VolumeTrend({ data, height = 260 }: { data: { m: string; count: number; days: number }[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="1" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
          <XAxis dataKey="m" tickLine={false} axisLine={false} tick={tick} />
          <YAxis yAxisId="c" tickLine={false} axisLine={false} width={30} tick={tick} />
          <YAxis yAxisId="d" orientation="right" tickLine={false} axisLine={false} width={30} tick={tick} tickFormatter={(v) => `${v}ว`} />
          <Tooltip formatter={(v, n) => (n === "วันอนุมัติเฉลี่ย" ? `${v} วัน` : `${v} ใบ`)} />
          <Area yAxisId="c" type="monotone" dataKey="count" name="จำนวนใบเบิก" stroke="#3b82f6" strokeWidth={2} fill="url(#vol)" />
          <Line yAxisId="d" type="monotone" dataKey="days" name="วันอนุมัติเฉลี่ย" stroke="#0f172a" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2.5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** แท่งแนวนอน (เช่น อายุเงินยืม) — สีส่งมาเองได้เมื่อเป็นสถานะจำเป็น (เกินกำหนด = แดง) */
export function HBars({ data, height = 180 }: { data: { name: string; value: number; color?: string }[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
          <XAxis type="number" tickLine={false} axisLine={false} tick={tick} tickFormatter={k} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={96} tick={tick} />
          <Tooltip cursor={{ fill: "#f1f5f9" }} formatter={money} />
          <Bar dataKey="value" name="ยอดเงิน" radius={[0, 5, 5, 0]} barSize={18}>
            {data.map((d, i) => <Cell key={i} fill={d.color ?? "#3b82f6"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** เส้นเล็ก (sparkline) สำหรับการ์ด */
export function Sparkline({ data, height = 40 }: { data: number[]; height?: number }) {
  const d = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={d} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.12} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
