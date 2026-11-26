/** ข้อผิดพลาดทางธุรกิจ → แปลงเป็น HTTP status ที่ API */
export class DomainError extends Error {
  constructor(public status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 500 | 502, message: string, public details?: unknown) {
    super(message);
    this.name = "DomainError";
  }
}

export const badRequest = (msg: string, details?: unknown) => new DomainError(400, msg, details);
export const forbidden = (msg = "ไม่มีสิทธิ์ทำรายการนี้") => new DomainError(403, msg);
export const notFound = (msg = "ไม่พบข้อมูล") => new DomainError(404, msg);
export const conflict = (msg: string) => new DomainError(409, msg);
