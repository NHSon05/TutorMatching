"use client";

import * as React from "react";
import { useSession } from "@/hooks/use-session";
import { Skeleton } from "@/components/ui/skeleton";
import { IncompleteProfileDashboard } from "./IncompleteProfileDashboard";
import { CompletedProfileDashboard } from "./CompletedProfileDashboard";

export function TutorDashboardClient() {
  const { data: account, isLoading } = useSession();

  // Hiển thị trạng thái Skeleton khi đang tải thông tin tài khoản
  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton width={200} height={32} />
            <Skeleton width={320} height={20} />
          </div>
          <Skeleton width={120} height={40} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton height={110} />
          <Skeleton height={110} />
          <Skeleton height={110} />
          <Skeleton height={110} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton height={160} />
            <Skeleton height={160} />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <Skeleton height={340} />
          </div>
        </div>
      </div>
    );
  }

  /**
   * Điều kiện phân định rõ ràng giữa 2 UI theo yêu cầu:
   * - Wireframe 1 (IncompleteProfileDashboard): Khi gia sư chưa hoàn thiện hồ sơ (tutorProfileStatus !== "APPROVED")
   * - Wireframe 2 (CompletedProfileDashboard): Khi gia sư đã hoàn thiện hồ sơ (tutorProfileStatus === "APPROVED")
   *
   * Chỉ một trong hai UI được hiển thị theo điều kiện, độc lập và tách bạch hoàn toàn.
   */
  const isProfileCompleted = account?.tutorProfileStatus === "APPROVED";

  if (!isProfileCompleted) {
    return <IncompleteProfileDashboard account={account} />;
  }

  return <CompletedProfileDashboard account={account} />;
}

export default TutorDashboardClient;
