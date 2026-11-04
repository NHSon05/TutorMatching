"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { useSignalREvents } from "@/hooks/use-signalr-events";
import {
  useConversations,
  useConversation,
  useConversationMessages,
  useSendMessage,
  useMarkMessagesRead,
} from "@/hooks/use-conversations";
import { ConversationList } from "./ConversationList";
import { ConversationChat } from "./ConversationChat";
import { MessageInput } from "./MessageInput";

export interface MessagesClientViewProps {
  initialConversationId?: string;
  role?: "learner" | "tutor";
}

export function MessagesClientView({
  initialConversationId,
  role = "learner",
}: MessagesClientViewProps) {
  const { data: session } = useSession();
  const activeRole = session?.role === "TUTOR" ? "tutor" : role;
  const searchParams = useSearchParams();
  const queryConversationId =
    initialConversationId ?? searchParams.get("conversationId") ?? undefined;

  const [userSelectedId, setUserSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const markedMessageIdsRef = useRef<Set<string>>(new Set());

  // Activate real-time events via SignalR
  const { isConnected } = useSignalREvents();

  const { data: convPage, isLoading: loadingConvs } = useConversations();
  const convItems = convPage?.items;

  // Derive active conversation without synchronous setState in effect
  const selectedId =
    userSelectedId ??
    queryConversationId ??
    (convItems && convItems.length > 0 ? convItems[0].id : null);

  // Reuse conversation from list if already loaded, avoiding redundant GET /conversations/{id} calls
  const cachedConv = convItems?.find((c) => c.id === selectedId);
  const { data: fetchedConv } = useConversation(cachedConv ? null : selectedId);
  const currentConv = cachedConv ?? fetchedConv ?? null;

  const { data: messagesPage, isLoading: loadingMessages } =
    useConversationMessages(selectedId);

  const messageItems = messagesPage?.items;

  const sendMessageMutation = useSendMessage(selectedId);
  const markReadMutation = useMarkMessagesRead(selectedId);

  // React Compiler automatically memoizes these derived values
  const chronologicalMessages = [...(messageItems ?? [])].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  );

  const filteredConversations = !convItems
    ? []
    : !searchTerm.trim()
      ? convItems
      : convItems.filter((c) =>
          c.otherParticipant.displayName
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );

  // Mark incoming unread messages as read once, tracking IDs to prevent infinite loops
  useEffect(() => {
    if (!selectedId || !session?.id || !messageItems || messageItems.length === 0) return;

    const unreadReceivedIds = messageItems
      .filter(
        (m) =>
          m.sender.id !== session.id &&
          !m.readAt &&
          !markedMessageIdsRef.current.has(m.id)
      )
      .map((m) => m.id);

    if (unreadReceivedIds.length === 0) return;

    unreadReceivedIds.forEach((id) => markedMessageIdsRef.current.add(id));
    markReadMutation.mutate(unreadReceivedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, session?.id, messageItems]);

  const handleSend = async (content: string) => {
    if (!selectedId || sendMessageMutation.isPending) return;

    setSendError(null);
    const clientMessageId = crypto.randomUUID();

    try {
      await sendMessageMutation.mutateAsync({
        clientMessageId,
        content,
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Không thể gửi tin nhắn. Vui lòng thử lại.";
      setSendError(errorMsg);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs h-[85vh] flex">
      {/* Cột trái: Danh sách cuộc trò chuyện */}
      <ConversationList
        conversations={filteredConversations}
        selectedId={selectedId}
        onSelect={(id) => setUserSelectedId(id)}
        isLoading={loadingConvs}
        isConnected={isConnected}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        role={activeRole}
      />

      {/* Cột phải: Khung chat và form nhập tin nhắn */}
      <div className="flex-1 flex flex-col justify-between bg-gray-50/40">
        <ConversationChat
          conversation={currentConv ?? null}
          messages={chronologicalMessages}
          currentUserId={session?.id}
          isLoading={loadingMessages}
          role={activeRole}
        />

        {selectedId && currentConv && (
          <MessageInput
            canSend={currentConv.canSend}
            isSending={sendMessageMutation.isPending}
            sendError={sendError}
            onSend={handleSend}
            role={activeRole}
          />
        )}
      </div>
    </div>
  );
}
