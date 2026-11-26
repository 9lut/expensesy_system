import { getActor } from "@/server/actor";
import { toErrorResponse } from "@/server/http";
import { readFile } from "@/server/service";

/** GET /api/files/[id] — เสิร์ฟไฟล์แนบหลังตรวจสิทธิ์ (เจ้าของ / ADMIN) · ไฟล์ใน Drive ไม่เปิดสาธารณะ */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const f = await readFile(await getActor(), id);
    return new Response(new Blob([f.data as BlobPart], { type: f.mime }), {
      headers: {
        "content-type": f.mime,
        "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(f.name)}`,
        "cache-control": "private, max-age=300",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
