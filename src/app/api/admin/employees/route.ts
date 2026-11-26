import { getActor } from "@/server/actor";
import { handle } from "@/server/http";
import { listEmployees } from "@/server/service";

/** GET /api/admin/employees — ADMIN (ไม่มีรหัสผ่าน / ข้อมูลลับ) */
export async function GET() {
  return handle(async () => listEmployees(await getActor()));
}
