import { getActor } from "@/server/actor";
import { body, handle } from "@/server/http";
import { getExpense, updateExpense } from "@/server/service";

/** GET /api/expenses/[id] — เจ้าของ / ADMIN */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handle(async () => getExpense(await getActor(), id));
}

/** PATCH /api/expenses/[id] — เจ้าของ แก้ได้เฉพาะสถานะร่าง / ส่งกลับแก้ไข */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handle(async () => updateExpense(await getActor(), id, await body(req)));
}
