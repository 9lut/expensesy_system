import { BANK_ACCOUNTS } from "@/lib/mock";
import { IN_PROGRESS, baht } from "@/lib/meta";
import { getStore } from "@/server/index";
import { requireUser } from "@/server/session";
import { ProfileView, type ProfileStat } from "./ProfileView";

/** โปรไฟล์: ข้อมูลผู้ใช้จาก Session · ผูก/เลิกผูก LINE · เปลี่ยนรหัสผ่าน */
export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ line?: string; error?: string }> }) {
  const u = await requireUser();
  const q = await searchParams;
  const store = getStore();
  const [mine, emps] = await Promise.all([store.listExpenses({ employeeId: u.id }), store.listEmployees()]);
  const approver = emps.find((e) => e.id === u.supervisorId) ?? emps.find((e) => e.role === "ADMIN" && e.id !== u.id && (!e.permissions || e.permissions.includes("APPROVE")));
  const year = new Date().getFullYear();
  const stats: ProfileStat[] = [
    { label: "ใบเบิกทั้งหมด", value: `${mine.length} ใบ` },
    { label: "เบิกได้แล้วปีนี้", value: baht(mine.filter((e) => e.type !== "advance" && e.status === "paid" && new Date(e.createdAt).getFullYear() === year).reduce((a, e) => a + e.total, 0)) },
    { label: "กำลังดำเนินการ", value: `${mine.filter((e) => IN_PROGRESS.includes(e.status)).length} ใบ`, tone: "text-amber-600" },
    { label: "เงินยืมค้างเคลียร์", value: baht(mine.filter((e) => e.type === "advance" && e.status === "paid").reduce((a, e) => a + e.total, 0)), tone: "text-rose-600" },
  ];
  // Phase 4: บัญชีธนาคารจะมาจากชีต employees (bank_name / bank_account)
  const bank = BANK_ACCOUNTS[u.id] ?? { bank: "-", no: "-", name: u.name };
  const flash = q.error ? { tone: "error" as const, text: q.error } : q.line === "linked" ? { tone: "ok" as const, text: "ผูกบัญชี LINE เรียบร้อย" } : undefined;
  return <ProfileView u={u} approverName={approver?.name ?? "-"} stats={stats} bank={bank} flash={flash} />;
}
