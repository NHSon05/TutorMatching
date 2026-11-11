"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ConversationSummary, MessageItem } from "@/lib/api/conversations";
import { Spinner } from "@/components/ui/spinner";
import { formatVietnamDateTime } from "@/lib/date-time";

export interface ConversationChatProps {
  conversation: ConversationSummary | null;
  messages: MessageItem[];
  currentUserId?: string;
  isLoading: boolean;
  role?: "learner" | "tutor";
}

export function ConversationChat({
  conversation,
  messages,
  currentUserId,
  isLoading,
  role = "learner",
}: ConversationChatProps) {
  const isTutor = role === "tutor";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever message count changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm">
        <p>
          Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Header chat */}
      <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-neutral-900">
            {conversation.otherParticipant.displayName}
          </h3>
          <div className="text-sm text-neutral-700 mt-0.5 flex items-center gap-2">
            <span>Mã yêu cầu: #{conversation.hireRequestId.slice(0, 8)}</span>
            <span>•</span>
            <span>Trạng thái: {conversation.requestStatus}</span>
          </div>
        </div>
        <Link
          href={
            isTutor
              ? `/request/${conversation.hireRequestId}`
              : `/learner/requests/${conversation.hireRequestId}`
          }
          className={`text-base hover:underline ${
            isTutor ? "text-brand hover:text-brand-700" : "text-brand"
          }`}
        >
          Xem chi tiết yêu cầu &rarr;
        </Link>
      </div>

      {/* Danh sách tin nhắn */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="h-full flex justify-center items-center">
            <Spinner size="medium" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-700 text-base">
            <p>Chưa có tin nhắn nào trong cuộc trò chuyện này.</p>
            <p className="text-base mt-1">Hãy gửi lời chào đầu tiên!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = currentUserId === msg.sender.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isMine ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-md px-4 py-2.5 rounded-2xl text-base shadow-2xs wrap-break-word ${
                    isMine
                      ? isTutor
                        ? "bg-brand text-white rounded-br-none"
                        : "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-neutral-900 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
                <div className="flex items-center gap-1.5 mt-1 px-1">
                  <span className="text-sm text-neutral-700">
                    {formatVietnamDateTime(msg.sentAt)}
                  </span>
                  {isMine && (
                    <span
                      className={`text-sm ${
                        isTutor ? "text-brand font-medium" : "text-brand"
                      }`}
                    >
                      {msg.readAt ? "✓✓ Đã xem" : "✓ Đã gửi"}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </>
  );
}
