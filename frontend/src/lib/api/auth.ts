export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role: "LEARNER" | "TUTOR";
}

export interface AccountResponse {
  id: string;
  email: string;
  fullName: string;
  role: "LEARNER" | "TUTOR" | "ADMIN";
  status: "ACTIVE" | "LOCKED" | "INACTIVE";
}

export interface ApiProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

export interface CsrfResponse {
  requestToken: string;
  headerName: string;
}

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5014/api/v1"
).replace(/\/+$/, "");

export async function throwApiProblem(response: Response): Promise<never> {
  let problem: ApiProblemDetails = {};
  try {
    const body: unknown = await response.json();
    if (body !== null && typeof body === "object") {
      problem = body as ApiProblemDetails;
    }
  } catch {
    // A proxy or unavailable server may return a non-JSON error response.
  }

  const title = typeof problem.title === "string"
    ? problem.title
    : "Không thể xử lý yêu cầu. Vui lòng thử lại.";
  throw Object.assign(new Error(title), {
    status: response.status,
    title,
    errors: problem.errors,
    retryAfter: response.headers.get("Retry-After"),
  });
}

export async function getCsrfToken(): Promise<CsrfResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return throwApiProblem(response);
  }

  const csrf: CsrfResponse = await response.json();
  if (
    !csrf || csrf.headerName !== "X-CSRF-TOKEN" ||
    typeof csrf.requestToken !== "string" || !csrf.requestToken.trim()
  ) {
    throw new Error("Không thể lấy mã bảo vệ yêu cầu. Vui lòng thử lại.");
  }
  return csrf;
}

export async function registerAccount(
  request: RegisterRequest
): Promise<AccountResponse> {
  const csrf = await getCsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    [csrf.headerName]: csrf.requestToken,
  };

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    return throwApiProblem(response);
  }

  return response.json();
}
