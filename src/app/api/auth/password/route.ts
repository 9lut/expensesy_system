import { getActor } from "@/server/actor";
import { changePassword } from "@/server/auth";
import { body, handle } from "@/server/http";
import { setSession } from "@/server/session";

/** POST /api/auth/password { current, next } — ใช้ได้ทั้งตอนบังคับเปลี่ยนครั้งแรก */
export async function POST(req: Request) {
  return handle(async () => {
    const actor = await getActor({ allowMustChange: true });
    await changePassword(actor, await body(req));
    await setSession(actor, false);
    return { next: actor.role === "ADMIN" ? "/select-view" : "/" };
  });
}
