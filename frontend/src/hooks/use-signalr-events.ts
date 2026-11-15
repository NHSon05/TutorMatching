"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { API_BASE_URL } from "@/lib/api/http";

export interface SignalRMessageEvent {
  schemaVersion: number;
  eventId: string;
  conversationId: string;
  messageId?: string;
}

// One hub connection per signed-in session, shared by every mounted consumer
// (header bell, messages view). The last consumer to unmount stops it.
interface SharedConnection {
  sessionId: string;
  connection: HubConnection;
  refs: number;
  connected: boolean;
  /** Settles (never rejects) once the initial start attempt finishes. */
  started: Promise<void>;
}

let shared: SharedConnection | null = null;
const listeners = new Set<() => void>();

// Only the current connection may change the published state; a retired one closing later must not.
function setConnected(connection: HubConnection, value: boolean) {
  if (!shared || shared.connection !== connection || shared.connected === value)
    return;
  shared.connected = value;
  listeners.forEach((notify) => notify());
}

function invalidateNotifications(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
}

function createConnection(
  sessionId: string,
  queryClient: QueryClient
): SharedConnection {
  const hubUrl = `${API_BASE_URL.replace(/\/api\/v1\/?$/, "")}/api/v1/hubs/events`;
  const connection = new HubConnectionBuilder()
    .withUrl(hubUrl, { withCredentials: true })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
    .configureLogging(LogLevel.Warning)
    .build();

  const refreshConversation = (event: SignalRMessageEvent) => {
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    // The Messenger badge counts unread messages; refresh it without waiting
    // for the notification outbox.
    queryClient.invalidateQueries({
      queryKey: ["notifications", "unread-count"],
    });
    if (event.conversationId) {
      queryClient.invalidateQueries({
        queryKey: ["messages", event.conversationId],
      });
    }
  };

  // Listeners are registered before start so no early event is dropped.
  connection.on("MessageCreated", refreshConversation);
  connection.on("MessagesRead", refreshConversation);
  connection.on("NotificationsChanged", () =>
    invalidateNotifications(queryClient)
  );

  // Missed events are recovered through REST after a reconnect.
  connection.onreconnected(() => {
    setConnected(connection, true);
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    invalidateNotifications(queryClient);
  });
  connection.onreconnecting(() => setConnected(connection, false));
  connection.onclose(() => setConnected(connection, false));

  const entry: SharedConnection = {
    sessionId,
    connection,
    refs: 0,
    connected: false,
    started: Promise.resolve(),
  };

  entry.started = connection
    .start()
    .then(() => {
      setConnected(connection, true);
    })
    .catch((err) => {
      // A connection retired before it finished starting is not a failure.
      if (shared === entry) console.warn("SignalR connection failed:", err);
    });

  return entry;
}

// Stopping while start() is still negotiating makes SignalR reject with
// "The connection was stopped during negotiation", so wait for start to settle.
function stopWhenStarted(entry: SharedConnection) {
  void entry.started.then(() => {
    if (entry.connection.state !== HubConnectionState.Disconnected) {
      void entry.connection.stop();
    }
  });
}

function retire(entry: SharedConnection) {
  if (shared !== entry) return;
  shared = null;
  listeners.forEach((notify) => notify());
  stopWhenStarted(entry);
}

function release(entry: SharedConnection) {
  entry.refs -= 1;
  if (entry.refs > 0) return;
  // Defer so a React Strict Mode unmount/remount or a route change that swaps
  // one consumer for another reuses the same connection instead of restarting it.
  setTimeout(() => {
    if (entry.refs === 0) retire(entry);
  }, 0);
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

export function useSignalREvents() {
  const { data: session } = useSession();
  const sessionId = session?.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;
    if (shared && shared.sessionId !== sessionId) {
      // A different account signed in; never reuse the previous user's channel.
      retire(shared);
    }
    shared ??= createConnection(sessionId, queryClient);
    const entry = shared;
    entry.refs += 1;
    return () => release(entry);
  }, [sessionId, queryClient]);

  const isConnected = useSyncExternalStore(
    subscribe,
    () =>
      Boolean(sessionId && shared?.sessionId === sessionId && shared.connected),
    () => false
  );

  return { isConnected };
}
