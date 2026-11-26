import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * POST /api/ocr  (multipart: file=<รูปใบเสร็จ>)
 * Phase 1 (เครื่อง dev): เรียก OpenThai2.1-OCR-Text ผ่าน Python (ocr-service) แล้วคืนผลเป็น JSON
 * ถัดไป: ย้ายไปรันในเบราว์เซอร์ด้วย onnxruntime-web (ไม่ต้องใช้ Python บน production)
 *
 * ตั้งค่าใน .env.local:  OCR_PYTHON=<python.exe ใน venv>  OCR_SCRIPT=<ocr-service/tools/run_ocr.py>
 */
const MAX_BYTES = 10 * 1024 * 1024;
const TIMEOUT_MS = 60_000;

function runOcr(python: string, script: string, image: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // ส่งเป็นอาร์กิวเมนต์ ไม่ผ่าน shell
    const p = spawn(python, [script, image], { env: { ...process.env, PYTHONIOENCODING: "utf-8" }, windowsHide: true });
    let out = "";
    let err = "";
    const timer = setTimeout(() => { p.kill(); reject(new Error("OCR ใช้เวลานานเกินไป")); }, TIMEOUT_MS);
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", (e) => { clearTimeout(timer); reject(e); });
    p.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(err.trim().split("\n").pop() || `OCR exited with ${code}`));
    });
  });
}

export async function POST(request: Request) {
  const python = process.env.OCR_PYTHON;
  const script = process.env.OCR_SCRIPT;
  if (!python || !script) {
    return Response.json({ error: "ยังไม่ได้ตั้งค่า OCR (OCR_PYTHON / OCR_SCRIPT)" }, { status: 501 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "ไม่พบไฟล์รูป" }, { status: 400 });
  if (!file.type.startsWith("image/")) return Response.json({ error: "รองรับเฉพาะไฟล์รูป" }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "ไฟล์ใหญ่เกิน 10 MB" }, { status: 413 });

  const dir = path.join(tmpdir(), "expense-ocr");
  await mkdir(dir, { recursive: true });
  const img = path.join(dir, `${randomUUID()}.${file.type === "image/png" ? "png" : "jpg"}`);
  try {
    await writeFile(img, Buffer.from(await file.arrayBuffer()));
    const json = await runOcr(python, script, img);
    return new Response(json, { headers: { "content-type": "application/json; charset=utf-8" } });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "OCR ล้มเหลว" }, { status: 500 });
  } finally {
    await rm(img, { force: true });
  }
}
