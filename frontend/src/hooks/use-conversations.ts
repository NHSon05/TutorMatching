"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  conversationsApi,
  ConversationSummary,
  ConversationPage,
  MessagePage,
  MessageItem,
} from "@/lib/api/conversations";

export function useConversations(cursor?: string, pageSize = 20) {
  return useQuery<ConversationPage>({
    queryKey: ["conversations", cursor, pageSize],
    queryFn: () => conversationsApi.getConversations(cursor, pageSize),
    staleTime: 10000,
  });
}

export function useConversation(conversationId: string | null) {
  return useQuery<ConversationSummary>({
    queryKey: ["conversation", conversationId],
    queryFn: () => conversationsApi.getConversation(conversationId!),
    enabled: Boolean(conversationId),
    staleTime: 10000,
  });
}

export function useConversationMessages(
  conversationId: string | null,
  cursor?: string,
  pageSize = 50
) {
  return useQuery<MessagePage>({
    queryKey: ["messages", conversationId, cursor, pageSize],
    queryFn: () =>
      conversationsApi.getMessages(conversationId!, cursor, pageSize),
    enabled: Boolean(conversationId),
    staleTime: 5000,
  });
}

export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientMessageId,
      content,
    }: {
      clientMessageId: string;
      content: string;
    }) =>
      conversationsApi.sendMessage(conversationId!, clientMessageId, content),
    onSuccess: (newMessage: MessageItem) => {
      queryClient.setQueryData<MessagePage>(
        ["messages", conversationId, undefined, 50],
        (old) => {
          if (!old) return { items: [newMessage], nextCursor: null };
          // If already present (e.g. via SignalR), avoid duplicate
          if (old.items.some((m) => m.id === newMessage.id)) return old;
          return {
            ...old,
            items: [newMessage, ...old.items],
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkMessagesRead(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageIds: string[]) =>
      conversationsApi.markRead(conversationId!, messageIds),
    onMutate: async (messageIds: string[]) => {
      if (!conversationId || messageIds.length === 0) return;

      const now = new Date().toISOString();
      const readSet = new Set(messageIds);

      // Optimistically mark messages as read in cache so UI and effects see readAt immediately
      queryClient.setQueriesData<MessagePage>(
        { queryKey: ["messages", conversationId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((m) =>
              readSet.has(m.id) ? { ...m, readAt: m.readAt ?? now } : m
            ),
          };
        }
      );

      // Optimistically clear unread count for this conversation in the conversations list
      queryClient.setQueriesData<ConversationPage>(
        { queryKey: ["conversations"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((c) =>
              c.id === conversationId ? { ...c, unreadCount: 0 } : c
            ),
          };
        }
      );
    },
    onSuccess: () => {
      // Mark queries as stale for background sync without triggering immediate refetch storms
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
        refetchType: "none",
      });
    },
  });
}
