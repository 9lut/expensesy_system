import { getActor } from "@/server/actor";
import { handle } from "@/server/http";
import { getSession } from "@/server/session";

/** GET /api/me — ผู้ใช้ที่ Login อยู่ */
export async function GET() {
  return handle(async () => {
    const employee = await getActor({ allowMustChange: true });
    return { employee, mustChange: !!(await getSession())?.mc };
  });
}
