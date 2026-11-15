import { PageTransition } from "@/components/layouts/PageTransition";
import { AuthGuard } from "@/components/AuthGuard";
import { AdminLayoutShell } from "@/components/layouts/AdminLayoutShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="ADMIN">
      <AdminLayoutShell>
        <PageTransition>{children}</PageTransition>
      </AdminLayoutShell>
    </AuthGuard>
  );
}
