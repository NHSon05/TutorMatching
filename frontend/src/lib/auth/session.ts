import { API_BASE_URL, getCsrfToken, throwApiProblem, type AccountResponse } from "@/lib/api/auth";

export async function login(email: string, password: string): Promise<AccountResponse> {
  const csrf = await getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST", credentials: "include", cache: "no-store",
    headers: { "Content-Type": "application/json", [csrf.headerName]: csrf.requestToken },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (!response.ok) return throwApiProblem(response);
  return response.json();
}

export async function getSession(): Promise<AccountResponse | null> {
  const response = await fetch(`${API_BASE_URL}/users/me`, { credentials: "include", cache: "no-store" });
  if (response.status === 401) return null;
  if (!response.ok) return throwApiProblem(response);
  return response.json();
}

export async function logout(): Promise<void> {
  const csrf = await getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST", credentials: "include", headers: { [csrf.headerName]: csrf.requestToken },
  });
  if (!response.ok && response.status !== 401) return throwApiProblem(response);
  window.dispatchEvent(new Event("session-ended"));
}
