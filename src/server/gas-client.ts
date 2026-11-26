// เรียก Google Apps Script Web App: POST {secret, action, payload} → {ok, data | error, code}
import { DomainError } from "./errors";

const TIMEOUT_MS = 30_000;

export async function gas<T>(action: string, payload: unknown = {}): Promise<T> {
  const url = process.env.GAS_URL;
  const secret = process.env.GAS_SECRET;
  if (!url || !secret) throw new DomainError(500, "ยังไม่ได้ตั้งค่า GAS_URL / GAS_SECRET ใน .env.local");

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      // text/plain = ไม่มี preflight · GAS ตอบ 302 ไป googleusercontent แล้ว fetch ตามให้เอง
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret, action, payload }),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    throw new DomainError(502, `เชื่อมต่อ Google Apps Script ไม่ได้ (${e instanceof Error ? e.name : "network"})`);
  }
  if (!res.ok) throw new DomainError(502, `Google Apps Script ตอบ HTTP ${res.status}`);

  const body = (await res.json().catch(() => null)) as { ok: boolean; data?: T; error?: string; code?: number } | null;
  if (!body) throw new DomainError(502, "Google Apps Script ไม่ได้ตอบเป็น JSON — ตรวจว่า Deploy เป็น Web app และให้สิทธิ์ Anyone");
  if (!body.ok) {
    if (body.code === 401) throw new DomainError(502, "GAS_SECRET ไม่ตรงกับ API_SECRET ใน Script Properties");
    const status = body.code === 404 || body.code === 409 || body.code === 400 ? body.code : 502;
    throw new DomainError(status, body.error || "Google Apps Script ทำรายการไม่สำเร็จ");
  }
  return body.data as T;
}
