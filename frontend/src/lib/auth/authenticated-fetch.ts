import { API_BASE_URL, getCsrfToken, throwApiProblem } from "@/lib/api/auth";

let pendingRefresh: Promise<boolean> | undefined;

async function restoreSession(): Promise<boolean> {
  // Web Locks coordinate tabs sharing HttpOnly cookies. Never fall back to
  // uncoordinated rotation, which would trigger the backend's reuse detection.
  if (!navigator.locks) {
    throw new Error("Không thể khôi phục phiên trên trình duyệt này. Vui lòng đăng nhập lại.");
  }
  return navigator.locks.request(`session-refresh:${API_BASE_URL}`, async () => {
    // Another tab may already have refreshed while this tab waited for the lock.
    const current = await fetch(`${API_BASE_URL}/users/me`, {
      credentials: "include", cache: "no-store",
    });
    if (current.ok) return true;
    if (current.status !== 401) return throwApiProblem(current);

    const csrf = await getCsrfToken();
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST", credentials: "include", cache: "no-store",
      headers: { [csrf.headerName]: csrf.requestToken },
    });
    if (response.status === 401) return false;
    if (!response.ok) return throwApiProblem(response);
    return true;
  });
}

/** For protected endpoints only. The callback must build a fresh request (and
 * CSRF token for mutations) so a body or pre-refresh CSRF token is not reused. */
export async function authenticatedFetch(send: () => Promise<Response>): Promise<Response> {
  const response = await send();
  if (response.status !== 401) return response;

  if (!pendingRefresh) {
    pendingRefresh = restoreSession().finally(() => { pendingRefresh = undefined; });
  }
  if (!await pendingRefresh) {
    window.dispatchEvent(new Event("session-ended"));
    return response;
  }
  const retried = await send();
  if (retried.status === 401) window.dispatchEvent(new Event("session-ended"));
  return retried;
}
