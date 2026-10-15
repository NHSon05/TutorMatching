"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import LandingView from "@/components/landing/LandingView";
import { LearnerDashboardClient } from "@/components/learner/LearnerDashboardClient";
import { TutorDashboardClient } from "@/components/tutor/dashboard/TutorDashboardClient";
import type { LearnerDashboardData } from "@/components/learner/types";

export function HomeClientView({
  initialRole,
  dashboardData,
}: {
  initialRole?: string | null;
  dashboardData: LearnerDashboardData;
}) {
  const router = useRouter();
  const { data: account, isLoading } = useSession();

  const role = account?.role ?? (isLoading ? initialRole : null);
  const tutorStatus = account?.tutorProfileStatus;

  // 1. ADMIN -> điều hướng sang /admin/dashboard
  useEffect(() => {
    if (!isLoading && role === "ADMIN") {
      router.replace("/admin/dashboard");
    }
  }, [isLoading, role, router]);

  // 2. TUTOR với trạng thái chưa duyệt -> điều hướng sang /tutor/onboarding
  useEffect(() => {
    if (!isLoading && role === "TUTOR") {
      if (tutorStatus !== "APPROVED") {
        router.replace("/tutor/onboarding");
      }
    }
  }, [isLoading, role, tutorStatus, router]);

  if (role === "ADMIN") {
    return null;
  }

  if (role === "TUTOR") {
    if (tutorStatus !== "APPROVED") {
      return null;
    }
    return <TutorDashboardClient />;
  }

  if (role === "LEARNER") {
    return <LearnerDashboardClient data={dashboardData} />;
  }

  return <LandingView />;
}
