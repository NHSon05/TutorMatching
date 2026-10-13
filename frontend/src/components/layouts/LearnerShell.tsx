"use client";

import * as React from "react";
import { LearnerNavigationRail } from "@/components/navigation/LearnerNavigationRail";
import { DashboardTopBar } from "@/components/learner/DashboardTopBar";
import { mockLearnerDashboardData } from "@/data/mockLearnerDashboard";
import type { AccountResponse } from "@/lib/api/auth";
import { AuthenticatedAccountContext } from "@/hooks/use-authenticated-account";

export function LearnerShell({
  account,
  children,
}: {
  account: AccountResponse;
  children: React.ReactNode;
}) {
  const user = {
    ...mockLearnerDashboardData.user,
    name: account.fullName || mockLearnerDashboardData.user.name,
  };

  return (
    <AuthenticatedAccountContext.Provider value={account}>
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
        {/* Sidebar bên trái */}
        <LearnerNavigationRail />
        {/* Vùng giao diện chính bên phải */}
        <div className="flex-1 min-w-0 flex flex-col w-full">
          <main className="min-w-0 max-w-8xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
            <DashboardTopBar user={user} />
            {children}
          </main>
        </div>
      </div>
    </AuthenticatedAccountContext.Provider>
  );
}
