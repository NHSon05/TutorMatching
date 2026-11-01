"use client";

import { useEffect, useRef, useState } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { API_BASE_URL } from "@/lib/api/http";

export interface SignalRMessageEvent {
  schemaVersion: number;
  eventId: string;
  conversationId: string;
  messageId?: string;
}

export function useSignalREvents() {
  const { data: session } = useSession();
  const sessionId = session?.id;
  const queryClient = useQueryClient();
  const connectionRef = useRef<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
        setIsConnected(false);
      }
      return;
    }
    const hubUrl = `${API_BASE_URL.replace(/\/api\/v1\/?$/, "")}/api/v1/hubs/events`;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("MessageCreated", (event: SignalRMessageEvent) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (event.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ["messages", event.conversationId],
        });
      }
    });

    connection.on("MessagesRead", (event: SignalRMessageEvent) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (event.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ["messages", event.conversationId],
        });
      }
    });

    connection.on("NotificationsChanged", () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    });

    connection.onclose(() => {
      setIsConnected(false);
    });

    connection
      .start()
      .then(() => {
        setIsConnected(true);
      })
      .catch((err) => {
        console.warn("SignalR connection failed:", err);
        setIsConnected(false);
      });

    connectionRef.current = connection;

    return () => {
      if (connection.state === HubConnectionState.Connected) {
        connection.stop();
      }
      connectionRef.current = null;
      setIsConnected(false);
    };
  }, [sessionId, queryClient]);

  return { isConnected };
}
