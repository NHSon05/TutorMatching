import type { AccountResponse } from "@/lib/api/auth";
import { ApiError, http } from "@/lib/api/http";

function syncRoleCookie(role: string | null) {
  if (typeof document === "undefined") return;
  try {
    if (role) {
      document.cookie = `tm_role=${encodeURIComponent(role)}; path=/; max-age=604800; samesite=lax`;
    } else {
      document.cookie = "tm_role=; path=/; max-age=0; samesite=lax";
    }
  } catch {
    // Ignore in non-browser or strict sandbox environments
  }
}

export async function login(email: string, password: string): Promise<AccountResponse> {
  const { data } = await http.post<AccountResponse>("/auth/login", { email: email.trim(), password });
  syncRoleCookie(data?.role ?? null);
  return data;
}

export async function getSession(signal?: AbortSignal): Promise<AccountResponse | null> {
  try {
    const { data } = await http.get<AccountResponse>("/users/me", { signal });
    syncRoleCookie(data?.role ?? null);
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && error.path === "/users/me") {
      syncRoleCookie(null);
      return null;
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await http.post("/auth/logout");
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401 && error.path === "/auth/logout")) throw error;
  } finally {
    syncRoleCookie(null);
  }
  window.dispatchEvent(new Event("session-ended"));
}
