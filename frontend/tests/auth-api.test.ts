import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RegisterRequest } from "@/lib/api/auth";

const request: RegisterRequest = {
  fullName: "Test Learner",
  email: "learner@example.com",
  password: "password",
  passwordConfirmation: "password",
  role: "LEARNER",
};
const csrf = { requestToken: "test-csrf", headerName: "X-CSRF-TOKEN" };
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:5000/api/v1/");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("registration API client", () => {
  it("uses the documented versioned base URL and includes CSRF and cookies", async () => {
    const account = { id: "test-id", email: request.email, role: "LEARNER", status: "ACTIVE" };
    fetchMock.mockResolvedValueOnce(Response.json(csrf));
    fetchMock.mockResolvedValueOnce(Response.json(account, { status: 201 }));
    const { registerAccount } = await import("@/lib/api/auth");

    await expect(registerAccount(request)).resolves.toEqual(account);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:5000/api/v1/auth/csrf", expect.objectContaining({
      credentials: "include", method: "GET", cache: "no-store",
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:5000/api/v1/auth/register", expect.objectContaining({
      credentials: "include", method: "POST", body: JSON.stringify(request),
      headers: expect.objectContaining({ "X-CSRF-TOKEN": "test-csrf" }),
    }));
  });

  it("preserves CSRF rate-limit errors and never sends a registration POST", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ title: "Too many requests" }, {
      status: 429, headers: { "Retry-After": "60" },
    }));
    const { registerAccount } = await import("@/lib/api/auth");

    await expect(registerAccount(request)).rejects.toMatchObject({
      status: 429, title: "Too many requests", retryAfter: "60",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops after a CSRF network failure", async () => {
    const failure = new TypeError("Network unavailable");
    fetchMock.mockRejectedValueOnce(failure);
    const { registerAccount } = await import("@/lib/api/auth");

    await expect(registerAccount(request)).rejects.toBe(failure);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    null,
    {},
    { headerName: "X-CSRF-TOKEN", requestToken: "" },
    { headerName: "Unexpected-Header", requestToken: "test-csrf" },
  ])("rejects invalid CSRF responses without submitting: %j", async (body) => {
    fetchMock.mockResolvedValueOnce(Response.json(body));
    const { registerAccount } = await import("@/lib/api/auth");

    await expect(registerAccount(request)).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("preserves field errors and the HTTP status from registration", async () => {
    fetchMock.mockResolvedValueOnce(Response.json(csrf));
    fetchMock.mockResolvedValueOnce(Response.json({
      status: 500, title: "Invalid input", errors: { email: ["Invalid email"] },
    }, { status: 422 }));
    const { registerAccount } = await import("@/lib/api/auth");

    await expect(registerAccount(request)).rejects.toMatchObject({
      status: 422, errors: { email: ["Invalid email"] },
    });
  });

  it("preserves non-JSON server failure status without submitting", async () => {
    fetchMock.mockResolvedValueOnce(new Response("Unavailable", { status: 503 }));
    const { registerAccount } = await import("@/lib/api/auth");

    await expect(registerAccount(request)).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
