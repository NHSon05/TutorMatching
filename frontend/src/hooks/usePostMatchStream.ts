"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api/http";
import type { MatchedPostNotificationItem } from "@/lib/api/tutor-demands";

export type StreamConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "closed";

export interface UsePostMatchStreamOptions {
  enabled?: boolean;
  maxItems?: number;
}

export interface UsePostMatchStreamResult {
  status: StreamConnectionStatus;
  liveItems: MatchedPostNotificationItem[];
  lastEventId: string | null;
}

export function usePostMatchStream(
  options: UsePostMatchStreamOptions = {}
): UsePostMatchStreamResult {
  const { enabled = true, maxItems = 50 } = options;
  const [status, setStatus] = useState<StreamConnectionStatus>(
    enabled ? "connecting" : "idle"
  );
  const [liveItems, setLiveItems] = useState<MatchedPostNotificationItem[]>([]);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  const retryCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || typeof EventSource === "undefined") {
      setStatus("idle");
      return;
    }

    let unmounted = false;

    function connect() {
      if (unmounted) return;

      const streamUrl = `${API_BASE_URL}/tutors/me/matched-posts/stream`;
      const es = new EventSource(streamUrl, { withCredentials: true });
      sourceRef.current = es;

      es.onopen = () => {
        if (unmounted) return;
        retryCountRef.current = 0;
        setStatus("connected");
      };

      es.addEventListener("post_matched", (event: MessageEvent) => {
        if (unmounted) return;
        try {
          const parsed = JSON.parse(
            String(event.data)
          ) as MatchedPostNotificationItem;
          if (event.lastEventId) {
            setLastEventId(event.lastEventId);
          }
          setLiveItems((prev) => {
            const deduplicated = prev.filter(
              (item) => item.notificationId !== parsed.notificationId
            );
            return [parsed, ...deduplicated].slice(0, maxItems);
          });
        } catch {
          // Ignore malformed SSE payload frames
        }
      });

      es.onerror = () => {
        if (unmounted) return;
        es.close();
        setStatus("reconnecting");

        const attempt = retryCountRef.current;
        retryCountRef.current = attempt + 1;
        const delayMs = Math.min(30_000, 1000 * Math.pow(2, attempt));

        timerRef.current = setTimeout(() => {
          connect();
        }, delayMs);
      };
    }

    connect();

    return () => {
      unmounted = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      sourceRef.current?.close();
    };
  }, [enabled, maxItems]);

  return {
    status,
    liveItems,
    lastEventId,
  };
}
