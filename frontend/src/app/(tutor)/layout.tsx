import { TutorGuard } from "@/components/tutor/TutorGuard";
import { TutorLayoutShell } from "@/components/layouts/TutorLayoutShell";

export default function TutorRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TutorGuard>
      <TutorLayoutShell>{children}</TutorLayoutShell>
    </TutorGuard>
  );
}
