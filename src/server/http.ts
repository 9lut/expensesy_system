// รูปแบบคำตอบ API: { ok: true, data } | { ok: false, error, issues? }
import { ZodError } from "zod";
import { DomainError } from "./errors";

export function toErrorResponse(e: unknown): Response {
  if (e instanceof ZodError) {
    const issues = e.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    return Response.json({ ok: false, error: issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง", issues }, { status: 400 });
  }
  if (e instanceof DomainError) {
    return Response.json({ ok: false, error: e.message, ...(e.details ? { details: e.details } : {}) }, { status: e.status });
  }
  console.error("[api]", e);
  return Response.json({ ok: false, error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
}

export async function handle(fn: () => Promise<unknown>, status = 200): Promise<Response> {
  try {
    return Response.json({ ok: true, data: await fn() }, { status });
  } catch (e) {
    return toErrorResponse(e);
  }
}

/** อ่าน JSON body (ว่าง = {}) */
export async function body(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new DomainError(400, "body ต้องเป็น JSON");
  }
}
