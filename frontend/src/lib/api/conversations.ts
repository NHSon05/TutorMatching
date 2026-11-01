import { http } from "./http";

export interface ParticipantSummary {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface ConversationSummary {
  id: string;
  hireRequestId: string;
  requestStatus: string;
  otherParticipant: ParticipantSummary;
  createdAt: string;
  closedAt: string | null;
  unreadCount: number;
  canSend: boolean;
  avatarUrl?: string | null;
  tutorAvatarUrl?: string | null;
}

export interface ConversationPage {
  items: ConversationSummary[];
  nextCursor: string | null;
}

export interface MessageSender {
  id: string;
  displayName: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  sentAt: string;
  readAt: string | null;
  clientMessageId: string | null;
}

export interface MessagePage {
  items: MessageItem[];
  nextCursor: string | null;
}

export interface MarkReadResult {
  readAt: string;
  changedCount: number;
}

export const conversationsApi = {
  getConversations: async (
    cursor?: string,
    pageSize = 20
  ): Promise<ConversationPage> => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (pageSize) params.set("pageSize", pageSize.toString());
    const res = await http.get<ConversationPage>(
      `/conversations?${params.toString()}`
    );
    return res.data;
  },

  getConversation: async (id: string): Promise<ConversationSummary> => {
    const res = await http.get<ConversationSummary>(`/conversations/${id}`);
    return res.data;
  },

  getMessages: async (
    id: string,
    cursor?: string,
    pageSize = 40
  ): Promise<MessagePage> => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (pageSize) params.set("pageSize", pageSize.toString());
    const res = await http.get<MessagePage>(
      `/conversations/${id}/messages?${params.toString()}`
    );
    return res.data;
  },

  sendMessage: async (
    id: string,
    clientMessageId: string,
    content: string
  ): Promise<MessageItem> => {
    const res = await http.post<MessageItem>(`/conversations/${id}/messages`, {
      clientMessageId,
      content,
    });
    return res.data;
  },

  markRead: async (
    id: string,
    messageIds: string[]
  ): Promise<MarkReadResult> => {
    const res = await http.post<MarkReadResult>(`/conversations/${id}/read`, {
      messageIds,
    });
    return res.data;
  },
};
