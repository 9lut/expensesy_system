import { cookies } from "next/headers";
import { baseUrlOf, findByLine, lineExchangeCode, lineLinkProfile } from "@/server/auth";
import { getActor } from "@/server/actor";
import { setSession } from "@/server/session";

/** GET /api/auth/line/callback?code&state — กลับจาก LINE Login */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = baseUrlOf(req);
  const jar = await cookies();
  const saved = jar.get("ee_line_state")?.value ?? "";
  jar.delete("ee_line_state");
  const [mode, state] = saved.split(".");
  const back = (path: string, msg?: string) => Response.redirect(`${base}${path}${msg ? `${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(msg)}` : ""}`, 303);
  const fail = mode === "login" ? "/login" : "/profile";

  if (url.searchParams.get("error")) return back(fail, "ยกเลิกการเข้าสู่ระบบด้วย LINE");
  const code = url.searchParams.get("code");
  if (!code || !state || url.searchParams.get("state") !== state) return back(fail, "ลิงก์ LINE หมดอายุ ลองใหม่อีกครั้ง");

  try {
    const profile = await lineExchangeCode(code, `${base}/api/auth/line/callback`, state);
    if (mode === "link") {
      await lineLinkProfile(await getActor(), profile);
      return back("/profile?line=linked");
    }
    const r = await findByLine(profile.userId);
    if (!r) return back("/login", "บัญชี LINE นี้ยังไม่ได้ผูกกับระบบ — เข้าสู่ระบบด้วยรหัสผ่าน แล้วผูกที่หน้าโปรไฟล์");
    await setSession(r.employee, r.mustChange);
    return back(r.mustChange ? "/change-password" : r.employee.role === "ADMIN" ? "/select-view" : "/");
  } catch (e) {
    return back(fail, e instanceof Error ? e.message : "LINE Login ไม่สำเร็จ");
  }
}
