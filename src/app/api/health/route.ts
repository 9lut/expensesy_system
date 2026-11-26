import { gas } from "@/server/gas-client";
import { getStore } from "@/server/index";
import { handle } from "@/server/http";

/** GET /api/health — แหล่งข้อมูลที่ใช้อยู่ + ทดสอบเชื่อม GAS */
export async function GET() {
  return handle(async () => {
    const store = getStore();
    if (store.name !== "gas") return { dataSource: "mock", note: "ข้อมูลอยู่ในหน่วยความจำ — ตั้ง DATA_SOURCE=gas เพื่อใช้ Google Sheet" };
    const t = Date.now();
    const ping = await gas<{ time: string; sheets: string[] }>("ping");
    return { dataSource: "gas", latencyMs: Date.now() - t, ...ping };
  });
}
