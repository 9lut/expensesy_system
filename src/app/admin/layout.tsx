import { AdminShell } from "@/components/ui/Shells";
import { requireUser } from "@/server/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser({ admin: true });
  return <AdminShell me={{ name: me.name, department: me.department, role: me.role }}>{children}</AdminShell>;
}
