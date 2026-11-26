import { handle } from "@/server/http";
import { listCategories } from "@/server/service";

/** GET /api/categories — หมวดค่าใช้จ่ายที่เปิดใช้ */
export async function GET() {
  return handle(listCategories);
}
