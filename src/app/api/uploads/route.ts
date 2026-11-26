import { getActor } from "@/server/actor";
import { DomainError } from "@/server/errors";
import { handle } from "@/server/http";
import { uploadFile } from "@/server/service";

/** POST /api/uploads (multipart: file) → { id, name, size, mime } */
export async function POST(req: Request) {
  return handle(async () => {
    const actor = await getActor();
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw new DomainError(400, "ไม่พบไฟล์");
    return uploadFile(actor, file);
  }, 201);
}
