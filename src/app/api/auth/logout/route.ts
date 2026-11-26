import { clearSession } from "@/server/session";

/** POST /api/auth/logout — ฟอร์ม HTML → กลับหน้า Login · fetch → JSON */
export async function POST(req: Request) {
  await clearSession();
  if ((req.headers.get("accept") ?? "").includes("text/html")) return Response.redirect(new URL("/login", req.url), 303);
  return Response.json({ ok: true, data: null });
}
