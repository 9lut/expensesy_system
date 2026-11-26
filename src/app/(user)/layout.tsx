import { UserShell } from "@/components/ui/Shells";
import { requireUser } from "@/server/session";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  return <UserShell me={{ name: me.name, department: me.department, role: me.role }}>{children}</UserShell>;
}
