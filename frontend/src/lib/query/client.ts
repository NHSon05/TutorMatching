import { QueryClient, type Query } from "@tanstack/react-query";
import type { AccountResponse } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/use-auth-store";

export const sessionKey = ["auth", "session"] as const;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false, gcTime: 0 },
    },
  });
}

// Queries are private by default. Public catalogs can opt in with meta: { public: true }.
function isPrivate(query: Query) {
  return query.meta?.public !== true;
}

export function replaceSession(client: QueryClient, account: AccountResponse | null) {
  if (typeof window !== "undefined") {
    try {
      if (account) sessionStorage.setItem("auth:account", JSON.stringify(account));
      else sessionStorage.removeItem("auth:account");
    } catch {
      // Ignore quota/private browsing exceptions
    }
  }

  // Đồng bộ trạng thái xác thực người dùng vào Zustand store
  if (account) {
    useAuthStore.getState().setAuth({ user: account });
  } else {
    useAuthStore.getState().clearAuth();
  }

  // Cancellation takes effect synchronously; late responses cannot repopulate old private data.
  void client.cancelQueries({ predicate: isPrivate });
  client.removeQueries({
    predicate: (query) =>
      isPrivate(query) &&
      !(
        query.queryKey.length === 2 &&
        query.queryKey[0] === "auth" &&
        query.queryKey[1] === "session"
      ),
  });
  client.setQueryData<AccountResponse | null>(sessionKey, account);
}
