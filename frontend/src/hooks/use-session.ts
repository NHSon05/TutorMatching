"use client";

import { useQuery } from "@tanstack/react-query";
import { getSession } from "@/lib/auth/session";
import { sessionKey } from "@/lib/query/client";
import { useAuthStore } from "@/stores/use-auth-store";

/** const { data: account, isPending, error, refetch } = useSession(); */
export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async ({ signal }) => {
      const data = await getSession(signal);
      if (data) {
        useAuthStore.getState().setAuth({ user: data });
      } else {
        useAuthStore.getState().clearAuth();
      }
      return data;
    },
    staleTime: 0,
    retry: false,
  });
}
