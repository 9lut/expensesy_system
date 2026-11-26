import { resetPassword } from "@/server/auth";
import { body, handle } from "@/server/http";

/** POST /api/auth/reset { id, token, password } — ตั้งรหัสใหม่จากลิงก์ในอีเมล */
export async function POST(req: Request) {
  return handle(async () => { await resetPassword(await body(req)); return null; });
}
