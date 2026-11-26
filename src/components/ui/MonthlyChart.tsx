"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MONTHLY } from "@/lib/mock";

/** fill = ยืดเต็มพื้นที่ของการ์ด (ไม่เหลือที่ว่างด้านล่าง) โดยสูงอย่างน้อย 288px */
export function MonthlyChart({ fill = false }: { fill?: boolean }) {
  return (
    <div className={fill ? "min-h-72 flex-1" : "h-72"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={MONTHLY}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} width={40} fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
          <Tooltip cursor={{ fill: "#eff6ff" }} formatter={(v) => `${Number(v).toLocaleString("th-TH")} บาท`} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
          {/* โทนเดียว (น้ำเงิน เข้ม→อ่อน) ลดสีบนจอคอม */}
          <Bar dataKey="travel" name="ค่าเดินทาง" stackId="a" fill="#1d4ed8" />
          <Bar dataKey="general" name="ทั่วไป" stackId="a" fill="#60a5fa" />
          <Bar dataKey="advance" name="เงินยืม" stackId="a" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
