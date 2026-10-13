import { SiteShell } from "@/components/layouts/SiteShell";
import { getServerSessionRole } from "@/lib/auth/server-session";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialRole = await getServerSessionRole();
  return <SiteShell initialRole={initialRole}>{children}</SiteShell>;
}
