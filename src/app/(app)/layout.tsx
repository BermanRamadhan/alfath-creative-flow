import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { getNavAlerts } from "@/lib/nav-alerts";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const alerts = await getNavAlerts(user);
  return (
    <AppShell user={user} alerts={alerts}>
      {children}
    </AppShell>
  );
}
