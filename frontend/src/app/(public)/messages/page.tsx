import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { MessagesClientView } from "@/components/messaging";

export const metadata: Metadata = {
  title: "Tin Nhắn",
  description:
    "Trò chuyện và trao đổi thông tin yêu cầu học giữa học viên và gia sư.",
};

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center bg-white rounded-xl border border-gray-200">
          <Spinner size="large" />
        </div>
      }
    >
      <MessagesClientView role="learner" />
    </Suspense>
  );
}
