import { getActor } from "@/server/actor";
import { body, handle } from "@/server/http";
import { createExpense, listExpenses } from "@/server/service";

/** GET /api/expenses?status=pending,approved&type=travel&mine=1 — พนักงานเห็นของตัวเอง / ADMIN เห็นทั้งหมด */
export async function GET(req: Request) {
  return handle(async () => listExpenses(await getActor(), Object.fromEntries(new URL(req.url).searchParams)));
}

/** POST /api/expenses — สร้างใบเบิก { kind: "expense" | "advance", ... , submit } */
export async function POST(req: Request) {
  return handle(async () => createExpense(await getActor(), await body(req)), 201);
}
