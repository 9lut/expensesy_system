import { baseUrlOf, forgotPassword } from "@/server/auth";
import { body, handle } from "@/server/http";

/** POST /api/auth/forgot { email } — ตอบเหมือนกันเสมอ (ไม่บอกว่ามีบัญชีนี้หรือไม่) */
export async function POST(req: Request) {
  return handle(async () => forgotPassword(await body(req), baseUrlOf(req)));
}
