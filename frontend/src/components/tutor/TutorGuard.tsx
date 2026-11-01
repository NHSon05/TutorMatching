"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { AuthGuard } from "@/components/AuthGuard";

export function TutorGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: account, isLoading, error } = useSession();

  const isAllowedBeforeApproval =
    pathname === "/tutor/dashboard" ||
    pathname === "/tutor" ||
    pathname === "/tutor/onboarding" ||
    pathname === "/tutor/offers" ||
    pathname === "/tutor/profile-edit" ||
    pathname === "/tutor/requests" ||
    pathname.startsWith("/tutor/requests/");
  const isApproved = account?.tutorProfileStatus === "APPROVED";

  useEffect(() => {
    if (isLoading || error || !account) return;
    if (account.role !== "TUTOR") return;

    // 1. Gia sư đã ở trạng thái APPROVED thì không hiển thị trang onboarding nữa -> chuyển về dashboard
    if (isApproved && pathname === "/tutor/onboarding") {
      router.replace("/tutor/dashboard");
      return;
    }

    // 2. Profile, offers and dashboard are available before approval; teaching routes remain gated.
    if (!isApproved && !isAllowedBeforeApproval) {
      router.replace("/tutor/onboarding");
    }
  }, [account, error, isApproved, isLoading, isAllowedBeforeApproval, pathname, router]);

  // Nếu gia sư đã duyệt và đang ở /tutor/onboarding, chặn render để tránh chớp UI
  if (!isLoading && account?.role === "TUTOR" && isApproved && pathname === "/tutor/onboarding") {
    return null;
  }

  // Nếu là gia sư chưa được phê duyệt và đang ở route gated, chặn render để tránh chớp UI
  if (!isLoading && account?.role === "TUTOR" && !isApproved && !isAllowedBeforeApproval) {
    return null;
  }

  return <AuthGuard role="TUTOR">{children}</AuthGuard>;
}
