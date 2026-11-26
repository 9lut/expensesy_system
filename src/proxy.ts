// กันหน้าเว็บ: ยังไม่ Login → /login · ต้องเปลี่ยนรหัสผ่าน → /change-password · USER เข้า /admin ไม่ได้
// API (/api/*) ไม่ redirect — route handler ตรวจสิทธิ์เองและตอบ 401 / 403
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/server/session-token";

const PUBLIC = ["/login", "/forgot-password", "/reset-password", "/liff"];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const s = verifyToken(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!s) {
    if (isPublic) return NextResponse.next();
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    const res = NextResponse.redirect(url);
    if (req.cookies.get(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE); // โทเคนหมดอายุ / ปลอม
    return res;
  }
  if (s.mc && pathname !== "/change-password") return NextResponse.redirect(new URL("/change-password", req.url));
  if (pathname === "/login") return NextResponse.redirect(new URL(s.role === "ADMIN" ? "/select-view" : "/", req.url));
  if ((pathname.startsWith("/admin") || pathname === "/select-view") && s.role !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = {
  // ข้ามไฟล์ static / รูป / โลโก้ / pdf worker
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|brand/|samples/|pdf.worker.min.mjs).*)"],
};
