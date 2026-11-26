import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { baseUrlOf, lineAuthorizeUrl } from "@/server/auth";
import { toErrorResponse } from "@/server/http";

/** GET /api/auth/line/start?mode=link|login — ไป LINE Login (คอม) แล้วกลับมาที่ /api/auth/line/callback */
export async function GET(req: Request) {
  try {
    const mode = new URL(req.url).searchParams.get("mode") === "login" ? "login" : "link";
    const state = randomBytes(16).toString("hex");
    (await cookies()).set("ee_line_state", `${mode}.${state}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
    return Response.redirect(lineAuthorizeUrl(`${baseUrlOf(req)}/api/auth/line/callback`, state), 302);
  } catch (e) {
    return toErrorResponse(e);
  }
}
