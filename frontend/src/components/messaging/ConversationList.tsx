"use client";

import { ConversationSummary } from "@/lib/api/conversations";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { TextField } from "@/components/ui/text-field";

export interface ConversationListProps {
  conversations: ConversationSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  isConnected: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  role?: "learner" | "tutor";
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
  isConnected,
  searchTerm,
  onSearchChange,
  role = "learner",
}: ConversationListProps) {
  const isTutor = role === "tutor";
  return (
    <div className="w-80 md:w-96 border-r border-gray-100 flex flex-col bg-white">
      {/* Header hộp thư */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-neutral-900 text-xl">Hộp Thư</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span className="text-base text-gray-700">
              {isConnected ? "Kết nối trực tiếp" : "Đang kết nối..."}
            </span>
          </div>
        </div>
      </div>

      {/* Tìm kiếm */}
      <div className="p-3 border-b border-gray-100">
        <TextField
          size="medium"
          placeholder="Tìm kiếm trong hội thoại..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Danh sách các cuộc trò chuyện */}
      <div className="flex-1 overflow-y-auto divide-gray-100">
        {isLoading ? (
          <div className="p-6 flex justify-center items-center">
            <Spinner size="medium" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Không tìm thấy cuộc trò chuyện nào.
          </div>
        ) : (
          conversations.map((c) => {
            const isSelected = c.id === selectedId;
            const initial = c.otherParticipant.displayName
              .charAt(0)
              .toUpperCase();

            return (
              <div
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`p-3.5 cursor-pointer flex items-center gap-3 transition-colors ${
                  isSelected
                    ? isTutor
                      ? "bg-tutor-50 border-l-4 border-role-tutor shadow-2xs"
                      : "bg-blue-50/80 border-l-4 border-blue-600 shadow-2xs"
                    : isTutor
                      ? "hover:bg-tutor-50/40"
                      : "hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden ${
                    isTutor ? "bg-role-tutor" : "bg-blue-600"
                  }`}
                >
                  {c.otherParticipant.avatarUrl || c.avatarUrl ? (
                    <img
                      src={c.otherParticipant.avatarUrl || c.avatarUrl || ""}
                      alt={c.otherParticipant.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-base text-neutral-900 truncate">
                      {c.otherParticipant.displayName}
                    </h4>
                    {c.unreadCount > 0 && (
                      <span
                        className={`text-white text-base font-bold px-2 py-0.5 rounded-full ${
                          isTutor ? "bg-role-tutor" : "bg-blue-600"
                        }`}
                      >
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-sm text-neutral-700">
                    <span>Trạng thái: {c.requestStatus}</span>
                    {c.closedAt && (
                      <Badge
                        appearance="outline"
                        variant="gray"
                        className="text-[10px]"
                      >
                        Đã đóng
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
