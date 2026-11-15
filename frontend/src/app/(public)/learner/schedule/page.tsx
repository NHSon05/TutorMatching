import type { Metadata } from "next";
import { AuthGuard } from "@/components/AuthGuard";
import { LearnerScheduleClient } from "@/components/learner/LearnerScheduleClient";

export const metadata: Metadata = {
  title: "Thời khóa biểu",
  description: "Lịch học hằng tuần với các gia sư đang dạy kèm cho bạn.",
};

export default function LearnerSchedulePage() {
  return (
    <AuthGuard role="LEARNER">
      <LearnerScheduleClient />
    </AuthGuard>
  );
}
