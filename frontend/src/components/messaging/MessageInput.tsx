"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface MessageInputProps {
  canSend: boolean;
  isSending: boolean;
  sendError: string | null;
  onSend: (content: string) => Promise<void>;
  role?: "learner" | "tutor";
}

export function MessageInput({
  canSend,
  isSending,
  sendError,
  onSend,
  role = "learner",
}: MessageInputProps) {
  const isTutor = role === "tutor";
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSending || !canSend) return;

    await onSend(trimmed);
    setContent("");
  };

  return (
    <div className="p-3 bg-white border-t border-gray-200">
      {sendError && (
        <div className="mb-2 text-xs text-red-600 bg-red-50 p-2 rounded">
          {sendError}
        </div>
      )}

      {canSend ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={4000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung tin nhắn..."
              className={`flex-1 px-3.5 py-2 text-base border border-gray-200 rounded-lg focus:outline-none transition-colors ${
                isTutor
                  ? "focus:border-role-tutor focus:ring-1 focus:ring-role-tutor"
                  : "focus:border-blue-500"
              }`}
            />
            <Button
              type="submit"
              variant={isTutor ? "tutor" : "brand"}
              size="medium"
              disabled={!content.trim() || isSending}
              className={isTutor ? "px-5" : "bg-brand hover:bg-blue-700 text-white px-5"}
            >
              {isSending ? "Đang gửi..." : "Gửi"}
            </Button>
          </div>
          <div className="flex justify-end pr-1">
            <span
              className={`text-sm ${
                content.length > 3800
                  ? isTutor
                    ? "text-red-600"
                    : "text-amber-600"
                  : "text-neutral-700"
              }`}
            >
              {content.length}/4000 ký tự
            </span>
          </div>
        </form>
      ) : (
        <div className="p-2 text-center text-xs text-gray-500 bg-gray-50 rounded">
          Cuộc trò chuyện này đã đóng. Không thể gửi thêm tin nhắn.
        </div>
      )}
    </div>
  );
}
