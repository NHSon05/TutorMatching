import { afterEach, beforeEach, expect, it, vi } from "vitest";

const csrf = { headerName: "X-CSRF-TOKEN", requestToken: "fresh-csrf" };
const account = { id: "user", role: "LEARNER" };
const fetchMock = vi.fn<typeof fetch>();
const lock = vi.fn(async (_name: string, callback: () => Promise<unknown>) => callback());

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  lock.mockClear();
  lock.mockImplementation(async (_name, callback) => callback());
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("navigator", { locks: { request: lock } });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("refreshes an expired access token using CSRF and retries the session", async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json(csrf))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(Response.json(account));
  const { getSession } = await import("@/lib/auth/session");
  await expect(getSession()).resolves.toEqual(account);
  expect(fetchMock).toHaveBeenNthCalledWith(4, expect.stringContaining("/auth/refresh"), expect.objectContaining({
    credentials: "include", method: "POST", headers: { "X-CSRF-TOKEN": "fresh-csrf" },
  }));
});

it("shares a single refresh for concurrent requests", async () => {
  let refreshed = false;
  fetchMock.mockImplementation(async (url) => {
    if (String(url).endsWith("/csrf")) return Response.json(csrf);
    if (String(url).endsWith("/refresh")) { refreshed = true; return new Response(null, { status: 204 }); }
    return refreshed ? Response.json(account) : new Response(null, { status: 401 });
  });
  const { getSession } = await import("@/lib/auth/session");
  await expect(Promise.all([getSession(), getSession(), getSession()])).resolves.toEqual([account, account, account]);
  expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/refresh"))).toHaveLength(1);
  expect(lock).toHaveBeenCalledTimes(1);
});

it("rechecks cookies after another tab has refreshed without rotating again", async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json(account))
    .mockResolvedValueOnce(Response.json(account));
  const { getSession } = await import("@/lib/auth/session");
  await expect(getSession()).resolves.toEqual(account);
  expect(lock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/refresh"))).toBe(false);
});

it("serializes two independent tab clients with the shared browser lock", async () => {
  let queue: Promise<unknown> = Promise.resolve();
  lock.mockImplementation((_name, callback) => {
    const next = queue.then(callback);
    queue = next.catch(() => undefined);
    return next;
  });
  let refreshed = false;
  fetchMock.mockImplementation(async (url) => {
    if (String(url).endsWith("/csrf")) return Response.json(csrf);
    if (String(url).endsWith("/refresh")) { refreshed = true; return new Response(null, { status: 204 }); }
    return refreshed ? Response.json(account) : new Response(null, { status: 401 });
  });
  const firstTab = await import("@/lib/auth/session");
  vi.resetModules(); // A second tab has separate module state, but the same lock service.
  const secondTab = await import("@/lib/auth/session");
  await expect(Promise.all([firstTab.getSession(), secondTab.getSession()])).resolves.toEqual([account, account]);
  expect(lock).toHaveBeenCalledTimes(2);
  expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/refresh"))).toHaveLength(1);
});

it("allows retry after a network failure without ending the session", async () => {
  const ended = vi.spyOn(window, "dispatchEvent");
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json(csrf))
    .mockRejectedValueOnce(new TypeError("Network unavailable"));
  const { getSession } = await import("@/lib/auth/session");
  await expect(getSession()).rejects.toThrow("Network unavailable");
  expect(ended).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json(csrf))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(Response.json(account));
  await expect(getSession()).resolves.toEqual(account);
});

it("does not rotate without cross-tab coordination when Web Locks is unavailable", async () => {
  vi.stubGlobal("navigator", {});
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
  const { getSession } = await import("@/lib/auth/session");
  await expect(getSession()).rejects.toThrow("Không thể khôi phục phiên");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("ends the session when the refresh token is expired", async () => {
  const ended = vi.spyOn(window, "dispatchEvent");
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json(csrf))
    .mockResolvedValueOnce(new Response(null, { status: 401 }));
  const { getSession } = await import("@/lib/auth/session");
  await expect(getSession()).resolves.toBeNull();
  expect(ended).toHaveBeenCalledWith(expect.objectContaining({ type: "session-ended" }));
  expect(fetchMock).toHaveBeenCalledTimes(4);
});

it.each([503, 429])("preserves transient refresh failure %s without logging out", async (status) => {
  const ended = vi.spyOn(window, "dispatchEvent");
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json(csrf))
    .mockResolvedValueOnce(Response.json({ title: "Retry later" }, { status }));
  const { getSession } = await import("@/lib/auth/session");
  await expect(getSession()).rejects.toMatchObject({ status });
  expect(ended).not.toHaveBeenCalled();
});

it("never loops if the retried protected request is still unauthorized", async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json(csrf))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }));
  const { getSession } = await import("@/lib/auth/session");
  await expect(getSession()).resolves.toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(5);
});

it("keeps login and logout out of automatic refresh", async () => {
  fetchMock.mockResolvedValueOnce(Response.json(csrf))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json(csrf))
    .mockResolvedValueOnce(new Response(null, { status: 401 }));
  const { login, logout } = await import("@/lib/auth/session");
  await expect(login("test@example.com", "wrong")).rejects.toMatchObject({ status: 401 });
  await expect(logout()).resolves.toBeUndefined();
  expect(lock).not.toHaveBeenCalled();
});
