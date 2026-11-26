import { login } from "@/server/auth";
import { body, handle } from "@/server/http";
import { setSession } from "@/server/session";

/** POST /api/auth/login { login, password } → ตั้ง Session cookie */
export async function POST(req: Request) {
  return handle(async () => {
    const { employee, mustChange } = await login(await body(req));
    await setSession(employee, mustChange);
    return { employee, mustChange, next: mustChange ? "/change-password" : employee.role === "ADMIN" ? "/select-view" : "/" };
  });
}
