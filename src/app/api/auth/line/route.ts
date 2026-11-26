import { lineLogin } from "@/server/auth";
import { body, handle } from "@/server/http";
import { setSession } from "@/server/session";

/** POST /api/auth/line { idToken } (จาก LIFF) → ผูกแล้ว: เข้าระบบ · ยังไม่ผูก: { status: "need_link" } */
export async function POST(req: Request) {
  return handle(async () => {
    const r = await lineLogin(await body(req));
    if (r.status === "need_link") return r;
    await setSession(r.employee, r.mustChange);
    return { status: "ok", employee: r.employee, next: r.mustChange ? "/change-password" : "/" };
  });
}
