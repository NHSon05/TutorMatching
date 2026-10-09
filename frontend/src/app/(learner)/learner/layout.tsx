import * as React from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { LearnerNavigationRail } from "@/components/navigation/LearnerNavigationRail";
import { DashboardTopBar } from "@/components/learner/DashboardTopBar";
import { mockLearnerDashboardData } from "@/data/mockLearnerDashboard";

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = mockLearnerDashboardData.user;

  return (
    <AuthGuard role="LEARNER"><div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar bên trái */}
      <LearnerNavigationRail />
      {/* Vùng giao diện chính bên phải */}
      <div className="flex-1 min-w-0 flex flex-col w-full">
        {/* <LearnerTopNavigation /> */}
        <main className="min-w-0 max-w-8xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
          <DashboardTopBar user={user} />
          {children}
        </main>
      </div>
    </div></AuthGuard>
  );
}
