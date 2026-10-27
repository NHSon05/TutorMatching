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
    pathname === "/tutor/profile-edit";
  const isApproved = account?.tutorProfileStatus === "APPROVED";

  useEffect(() => {
    if (isLoading || error || !account) return;
    if (account.role !== "TUTOR") return;

    // Profile, offers and dashboard are available before approval; teaching routes remain gated.
    if (!isApproved && !isAllowedBeforeApproval) {
      router.replace("/tutor/onboarding");
    }
  }, [account, error, isApproved, isLoading, isAllowedBeforeApproval, router]);

  // Nếu là gia sư chưa được phê duyệt và đang ở route gated, chặn render để tránh chớp UI
  if (!isLoading && account?.role === "TUTOR" && !isApproved && !isAllowedBeforeApproval) {
    return null;
  }

  return <AuthGuard role="TUTOR">{children}</AuthGuard>;
}
