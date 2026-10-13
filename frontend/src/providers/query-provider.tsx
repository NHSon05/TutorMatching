"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient, replaceSession } from "@/lib/query/client";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);

  useEffect(() => {
    const endSession = () => replaceSession(client, null);
    const revalidate = () => {
      if (document.visibilityState !== "hidden") {
        void client.refetchQueries({ type: "active", stale: true }, { cancelRefetch: false });
      }
    };
    window.addEventListener("session-ended", endSession);
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    return () => {
      window.removeEventListener("session-ended", endSession);
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
    };
  }, [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
