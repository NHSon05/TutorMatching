import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { MessagesClientView } from "@/components/messaging";

export const metadata: Metadata = {
  title: "Tin Nhắn - Gia Sư",
  description:
    "Trò chuyện và trao đổi thông tin yêu cầu học giữa gia sư và học viên.",
};

export default function TutorMessagesPage() {
  return (
    <div className="space-y-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center bg-white rounded-xl border border-gray-200 h-[85vh]">
            <Spinner size="large" />
          </div>
        }
      >
        <MessagesClientView role="tutor" />
      </Suspense>
    </div>
  );
}
