import { getActor } from "@/server/actor";
import { lineLink, lineUnlink } from "@/server/auth";
import { body, handle } from "@/server/http";
import { getSession, setSession } from "@/server/session";

/** POST /api/auth/line/link { idToken, login?, password? } — LIFF ครั้งแรก (กรอกบัญชี) หรือผู้ใช้ที่ Login อยู่ */
export async function POST(req: Request) {
  return handle(async () => {
    const actor = (await getSession()) ? await getActor() : undefined;
    const r = await lineLink(await body(req), actor);
    if (!actor) await setSession(r.employee, r.mustChange);
    return { employee: r.employee, next: r.mustChange ? "/change-password" : "/" };
  });
}

/** DELETE /api/auth/line/link — ยกเลิกการผูก LINE ของตัวเอง */
export async function DELETE() {
  return handle(async () => { await lineUnlink(await getActor()); return null; });
}
