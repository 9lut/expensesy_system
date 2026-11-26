// ตั้งรหัสผ่านให้พนักงานใน Google Sheet (ใช้ตอนติดตั้งครั้งแรก เมื่อยังไม่มีแอดมินที่ Login ได้)
//
//   node --env-file=.env.local scripts/set-password.mjs <username|email> [รหัสผ่าน]
//
// ไม่ใส่รหัสผ่าน = สร้างรหัสชั่วคราวให้ และบังคับเปลี่ยนตอน Login ครั้งแรก
// รหัสผ่านถูก hash (bcrypt) บนเครื่องนี้ก่อนส่งไป Apps Script — ไม่มีรหัสผ่านเปล่าในชีต
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";

const [login, given] = process.argv.slice(2);
const { GAS_URL, GAS_SECRET } = process.env;
if (!login) { console.error("ใช้: node --env-file=.env.local scripts/set-password.mjs <username|email> [รหัสผ่าน]"); process.exit(1); }
if (!GAS_URL || !GAS_SECRET) { console.error("ต้องตั้ง GAS_URL และ GAS_SECRET ใน .env.local ก่อน (ดู gas/README.md)"); process.exit(1); }

async function gas(action, payload) {
  const res = await fetch(GAS_URL, { method: "POST", headers: { "content-type": "text/plain;charset=utf-8" }, body: JSON.stringify({ secret: GAS_SECRET, action, payload }), redirect: "follow" });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error);
  return j.data;
}

function temp() {
  const all = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  while (!/[a-z]/i.test(s) || !/\d/.test(s)) s = Array.from({ length: 10 }, () => all[randomInt(all.length)]).join("");
  return s;
}

const password = given ?? temp();
if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  console.error("รหัสผ่านต้องยาวอย่างน้อย 8 ตัว และมีทั้งตัวอักษรและตัวเลข");
  process.exit(1);
}

const emp = await gas("auth_find", { login });
if (!emp) { console.error(`ไม่พบพนักงาน "${login}" ในชีต employees`); process.exit(1); }
await gas("auth_update", {
  id: emp.id,
  patch: { password_hash: await bcrypt.hash(password, 10), must_change_password: given ? "FALSE" : "TRUE", failed_logins: "0", locked_until: "" },
});
console.log(`ตั้งรหัสผ่านให้ ${emp.id} (${emp.username}) แล้ว`);
if (!given) console.log(`รหัสชั่วคราว: ${password}  — ส่งให้พนักงานทางช่องทางที่ปลอดภัย ระบบจะบังคับเปลี่ยนตอน Login ครั้งแรก`);
