"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { AuthGuard } from "@/components/AuthGuard";

export function TutorGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: account, isLoading, error } = useSession();

  const isOnboarding = pathname === "/tutor/onboarding";
  const isApproved = account?.tutorProfileStatus === "APPROVED";

  useEffect(() => {
    if (isLoading || error || !account) return;
    if (account.role !== "TUTOR") return;

    // Gia sư chưa được phê duyệt không được phép truy cập vào bất kỳ route nào khác ngoài /tutor/onboarding
    if (!isApproved && !isOnboarding) {
      router.replace("/tutor/onboarding");
    }
  }, [account, error, isApproved, isLoading, isOnboarding, router]);

  // Nếu là gia sư chưa được phê duyệt và đang ở route khác ngoài onboarding, chặn render để tránh chớp UI
  if (!isLoading && account?.role === "TUTOR" && !isApproved && !isOnboarding) {
    return null;
  }

  return <AuthGuard role="TUTOR">{children}</AuthGuard>;
}
