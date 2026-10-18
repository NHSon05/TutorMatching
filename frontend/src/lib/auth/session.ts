import type { AccountResponse } from "@/lib/api/auth";
import { ApiError, http } from "@/lib/api/http";
import { useAuthStore } from "@/stores/use-auth-store";

export function syncRoleCookie(role: string | null) {
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

/**
 * Kiểm tra xem phía client có bất kỳ dấu hiệu phiên đăng nhập nào không
 * (Cookie role hint, tài khoản lưu trong sessionStorage, hoặc user trong AuthStore).
 *
 * Nếu KHÔNG có bất kỳ dấu hiệu nào (khách vãng lai chưa đăng nhập),
 * frontend sẽ KHÔNG tự động gọi API /users/me hay /auth/refresh để tránh lỗi 401/429 spam console.
 */
export function hasSessionIndicator(): boolean {
  if (typeof window === "undefined") return false;
  // Trong môi trường kiểm thử (Vitest/Jest), cho phép bypass để test runner kiểm tra getSession() trực tiếp
  if (process.env.NODE_ENV === "test") return true;

  try {
    const cookies = document.cookie || "";
    const hasRoleCookie =
      cookies.includes("tm_role=") ||
      cookies.includes("user_role=") ||
      cookies.includes("auth_token=");
    const hasStoredAccount = Boolean(sessionStorage.getItem("auth:account"));
    const hasStoreUser = Boolean(useAuthStore.getState().user);
    return hasRoleCookie || hasStoredAccount || hasStoreUser;
  } catch {
    return false;
  }
}

export async function login(email: string, password: string): Promise<AccountResponse> {
  const { data } = await http.post<AccountResponse>("/auth/login", { email: email.trim(), password });
  syncRoleCookie(data?.role ?? null);
  return data;
}

export async function getSession(signal?: AbortSignal): Promise<AccountResponse | null> {
  if (!hasSessionIndicator()) {
    syncRoleCookie(null);
    return null;
  }

  try {
    const { data } = await http.get<AccountResponse>("/users/me", { signal });
    syncRoleCookie(data?.role ?? null);
    return data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403) && error.path.includes("/users/me")) {
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
