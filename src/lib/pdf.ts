// แปลง PDF → รูป (ในเบราว์เซอร์) เพื่อส่งเข้า OCR เดิม
// worker อยู่ที่ /public/pdf.worker.min.mjs (คัดลอกอัตโนมัติตอน npm install — ดู scripts.postinstall)

const TARGET_WIDTH = 1240; // ≈150 dpi สำหรับ A4 — พอสำหรับ OCR และไม่ใหญ่เกิน
const GAP = 24;

export interface PdfImage {
  blob: Blob;
  /** จำนวนหน้าที่แปลง */
  pages: number;
  /** จำนวนหน้าทั้งหมดในไฟล์ */
  total: number;
}

/** เรนเดอร์ไม่เกิน maxPages หน้าแรก แล้วต่อกันแนวตั้งเป็นรูปเดียว (กรอบ OCR จะตรงกับรูปที่แสดง) */
export async function pdfToImage(file: File, maxPages = 3): Promise<PdfImage> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  try {
    const n = Math.min(doc.numPages, maxPages);
    const pages: HTMLCanvasElement[] = [];
    for (let i = 1; i <= n; i++) {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: TARGET_WIDTH / base.width });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvas, viewport }).promise;
      pages.push(canvas);
    }
    const out = document.createElement("canvas");
    out.width = TARGET_WIDTH;
    out.height = pages.reduce((h, c) => h + c.height, 0) + GAP * (pages.length - 1);
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#e2e8f0"; // เส้นคั่นระหว่างหน้า
    ctx.fillRect(0, 0, out.width, out.height);
    let y = 0;
    for (const c of pages) {
      ctx.drawImage(c, 0, y);
      y += c.height + GAP;
    }
    const blob = await new Promise<Blob>((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error("แปลง PDF ไม่สำเร็จ"))), "image/jpeg", 0.9));
    return { blob, pages: n, total: doc.numPages };
  } finally {
    await task.destroy();
  }
}
