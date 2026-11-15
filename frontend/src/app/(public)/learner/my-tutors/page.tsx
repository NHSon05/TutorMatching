import type { Metadata } from "next";
import { AuthGuard } from "@/components/AuthGuard";
import { MyTutorsClient } from "@/components/learner/MyTutorsClient";

export const metadata: Metadata = {
  title: "Gia sư của tôi",
  description: "Danh sách gia sư đang dạy kèm cho bạn.",
};

export default function MyTutorsPage() {
  return (
    <AuthGuard role="LEARNER">
      <MyTutorsClient />
    </AuthGuard>
  );
}
