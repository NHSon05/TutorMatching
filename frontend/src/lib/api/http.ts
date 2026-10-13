import axios, { type InternalAxiosRequestConfig } from "axios";
import type { ApiProblemDetails } from "@/types/api";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5014/api/v1"
).replace(/\/+$/, "");

export class ApiError extends Error {
  readonly title: string;

  constructor(
    readonly status: number,
    title: string,
    readonly errors: Record<string, string[]> | undefined,
    readonly retryAfter: string | null,
    readonly path: string,
  ) {
    super(title);
    this.name = "ApiError";
    this.title = title;
  }
}

function normalizeError(error: unknown): unknown {
  if (!axios.isAxiosError(error) || !error.response) return error;
  const body: unknown = error.response.data;
  const problem: ApiProblemDetails = body !== null && typeof body === "object" ? body : {};
  return new ApiError(
    error.response.status,
    typeof problem.title === "string" ? problem.title : "Không thể xử lý yêu cầu. Vui lòng thử lại.",
    problem.errors,
    error.response.headers["retry-after"] ?? null,
    error.config?.url?.split("?")[0] ?? "",
  );
}

const defaults = {
  baseURL: API_BASE_URL,
  withCredentials: true,
  adapter: "fetch",
  fetchOptions: { cache: "no-store" as const },
  headers: { Accept: "application/json" },
};

// Bypass renewal interceptors for CSRF, probing and refresh itself.
const transport = axios.create(defaults);

interface CsrfResponse {
  headerName: string;
  requestToken: string;
}

async function getCsrfToken(): Promise<CsrfResponse> {
  try {
    const { data } = await transport.get<CsrfResponse>("/auth/csrf");
    if (!data || data.headerName !== "X-CSRF-TOKEN" ||
      typeof data.requestToken !== "string" || !data.requestToken.trim()) {
      throw new Error("Không thể lấy mã bảo vệ yêu cầu. Vui lòng thử lại.");
    }
    return data;
  } catch (error) {
    throw normalizeError(error);
  }
}

let pendingRefresh: Promise<boolean> | undefined;

async function restoreSession(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    throw new Error("Không thể khôi phục phiên trên trình duyệt này. Vui lòng đăng nhập lại.");
  }
  return navigator.locks.request(`session-refresh:${API_BASE_URL}`, async () => {
    try {
      // Another tab may have refreshed while this tab waited for the lock.
      const current = await transport.get("/users/me", {
        validateStatus: status => (status >= 200 && status < 300) || status === 401,
      });
      if (current.status !== 401) return true;
      const csrf = await getCsrfToken();
      const response = await transport.post("/auth/refresh", undefined, {
        headers: { [csrf.headerName]: csrf.requestToken },
        validateStatus: status => (status >= 200 && status < 300) || status === 401,
      });
      return response.status !== 401;
    } catch (error) {
      throw normalizeError(error);
    }
  });
}

function endSession() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("session-ended"));
}

type RetryConfig = InternalAxiosRequestConfig & { sessionRetried?: boolean };

/** Browser backend client. Returns AxiosResponse<T>: const { data } = await http.get<T>("/users/me"). */
export const http = axios.create(defaults);

http.interceptors.request.use(async config => {
  if (typeof window === "undefined") throw new Error("http is a browser-only API client.");
  // Relative endpoint paths only: never forward cookies/CSRF to another origin or API.
  const path = config.url ?? "";
  const base = new URL(`${API_BASE_URL}/`, window.location.origin);
  const target = new URL(path.replace(/^\//, ""), base);
  if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith("//") || path.includes("\\") ||
    target.origin !== base.origin || !target.pathname.startsWith(base.pathname) ||
    (config.baseURL !== API_BASE_URL)) {
    throw new Error("http only accepts endpoint paths within the configured API.");
  }
  config.url = `/${target.pathname.slice(base.pathname.length)}${target.search}`;
  config.withCredentials = true;
  config.fetchOptions = { ...config.fetchOptions, cache: "no-store" };
  if (config.signal?.aborted) throw new axios.CanceledError();
  if (["post", "put", "patch", "delete"].includes(config.method ?? "get")) {
    const csrf = await getCsrfToken();
    config.headers.set(csrf.headerName, csrf.requestToken);
  }
  return config;
});

http.interceptors.response.use(response => response, async (error: unknown) => {
  if (!axios.isAxiosError(error) || !error.response || !error.config) throw error;
  const config: RetryConfig = error.config;
  const path = config.url?.split("?")[0] ?? "";
  if (error.response.status !== 401 || path === "/auth" || path.startsWith("/auth/")) {
    throw normalizeError(error);
  }
  if (config.signal?.aborted) throw new axios.CanceledError();
  if (!config.sessionRetried) {
    pendingRefresh ??= restoreSession().finally(() => { pendingRefresh = undefined; });
    const restored = await pendingRefresh;
    if (config.signal?.aborted) throw new axios.CanceledError();
    if (restored) {
      config.sessionRetried = true;
      return http.request(config);
    }
  }
  endSession();
  throw normalizeError(error);
});
