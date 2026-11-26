import { getActor } from "@/server/actor";
import { DomainError } from "@/server/errors";
import { body, handle } from "@/server/http";
import { transition } from "@/server/service";
import { ACTIONS, type Action } from "@/server/workflow";

/**
 * POST /api/expenses/[id]/{submit|cancel|approve|reject|return|verify|pay|clear|close}
 * body: { note } · pay: { method, ref, at? } · clear: { items: [...] }
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string; action: string }> }) {
  const { id, action } = await ctx.params;
  return handle(async () => {
    if (!ACTIONS.includes(action as Action)) throw new DomainError(404, `ไม่รู้จักคำสั่ง ${action}`);
    return transition(await getActor(), id, action as Action, await body(req));
  });
}
