import { getActor } from "@/server/actor";
import { adminResetPassword } from "@/server/auth";
import { handle } from "@/server/http";

/** POST /api/admin/employees/[id]/reset-password — ADMIN + MANAGE → รหัสชั่วคราว (แสดงครั้งเดียว) */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handle(async () => adminResetPassword(await getActor(), id));
}
