"use client";

import { useSession } from "@/hooks/use-session";
import LandingView from "@/components/landing/LandingView";
import { LearnerDashboardClient } from "@/components/learner/LearnerDashboardClient";
import type { LearnerDashboardData } from "@/components/learner/types";

export function HomeClientView({
  initialRole,
  dashboardData,
}: {
  initialRole?: string | null;
  dashboardData: LearnerDashboardData;
}) {
  const { data: account, isLoading } = useSession();

  const isLearner =
    account?.role === "LEARNER" ||
    (isLoading && initialRole === "LEARNER");

  if (isLearner) {
    return <LearnerDashboardClient data={dashboardData} />;
  }

  return <LandingView />;
}
