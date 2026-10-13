import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fetchTransport } from "./http-test-transport";

const csrf = { headerName: "X-CSRF-TOKEN", requestToken: "csrf" };
const fetchMock = vi.fn<typeof fetch>();
const lock = vi.fn(async (_name: string, callback: () => Promise<unknown>) => callback());

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  lock.mockClear();
  vi.stubGlobal("fetch", fetchTransport(fetchMock));
  vi.stubGlobal("navigator", { locks: { request: lock } });
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:5014/api/v1/");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it("gets typed data with params, custom headers and credentials", async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ name: "Test" }));
  const { http } = await import("@/lib/api/http");
  const response = await http.get<{ name: string }>("/users/me", {
    params: { detail: "full" }, headers: { "X-Test": "value" },
  });
  expect(response.data.name).toBe("Test");
  expect(fetchMock).toHaveBeenCalledWith("http://localhost:5014/api/v1/users/me?detail=full", expect.objectContaining({
    credentials: "include", cache: "no-store", headers: expect.objectContaining({ "x-test": "value" }),
  }));
});

it.each(["post", "put", "patch", "delete"] as const)("%s attaches CSRF and serializes JSON", async method => {
  fetchMock.mockResolvedValueOnce(Response.json(csrf)).mockResolvedValueOnce(new Response(null, { status: 204 }));
  const { http } = await import("@/lib/api/http");
  const payload = { name: "Updated" };
  const response = method === "delete" ? await http.delete("/resource/1", { data: payload }) :
    await http[method]("/resource/1", payload);
  expect(response.status).toBe(204);
  expect(fetchMock).toHaveBeenLastCalledWith("http://localhost:5014/api/v1/resource/1", expect.objectContaining({
    method: method.toUpperCase(), credentials: "include", body: JSON.stringify(payload),
    headers: expect.objectContaining({ "x-csrf-token": "csrf", "content-type": "application/json" }),
  }));
});

it("renews CSRF and preserves payload and params when retrying a mutation", async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ ...csrf, requestToken: "before" }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json({ ...csrf, requestToken: "refresh" }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(Response.json({ ...csrf, requestToken: "after" }))
    .mockResolvedValueOnce(Response.json({ name: "Updated" }));
  const { http } = await import("@/lib/api/http");
  const { data } = await http.put("/users/me", { name: "Updated" }, { params: { version: 1 } });
  expect(data).toEqual({ name: "Updated" });
  expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:5014/api/v1/users/me?version=1", expect.objectContaining({
    body: '{"name":"Updated"}', headers: expect.objectContaining({ "x-csrf-token": "before" }),
  }));
  expect(fetchMock).toHaveBeenLastCalledWith("http://localhost:5014/api/v1/users/me?version=1", expect.objectContaining({
    body: '{"name":"Updated"}', headers: expect.objectContaining({ "x-csrf-token": "after" }),
  }));
});

it.each([403, 429, 503])("does not refresh or end the session for a protected %s", async status => {
  const ended = vi.spyOn(window, "dispatchEvent");
  fetchMock.mockResolvedValueOnce(Response.json({ title: "Unavailable" }, { status }));
  const { http } = await import("@/lib/api/http");
  await expect(http.get("/users/me")).rejects.toMatchObject({ status });
  expect(lock).not.toHaveBeenCalled();
  expect(ended).not.toHaveBeenCalled();
});

it.each(["https://other.test/api", "//other.test/api", "../outside", "/../../outside", "/\\other.test/api"])(
  "rejects unsafe endpoint %s before sending CSRF or cookies", async path => {
    const { http } = await import("@/lib/api/http");
    await expect(http.post(path, {})).rejects.toThrow("endpoint paths");
    expect(fetchMock).not.toHaveBeenCalled();
  },
);

it("rejects base URL overrides", async () => {
  const { http } = await import("@/lib/api/http");
  await expect(http.get("/users/me", { baseURL: "https://other.test" })).rejects.toThrow("endpoint paths");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("does not send a request already canceled by its caller", async () => {
  const controller = new AbortController();
  controller.abort();
  const { http } = await import("@/lib/api/http");
  await expect(http.post("/users/me", {}, { signal: controller.signal })).rejects.toMatchObject({ code: "ERR_CANCELED" });
  expect(fetchMock).not.toHaveBeenCalled();
});

it("does not replay a canceled request after a shared refresh", async () => {
  let finishRefresh!: () => void;
  const refreshing = new Promise<void>(resolve => { finishRefresh = resolve; });
  let started!: () => void;
  const startedRefresh = new Promise<void>(resolve => { started = resolve; });
  const controller = new AbortController();
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json(csrf))
    .mockImplementationOnce(async () => { started(); await refreshing; return new Response(null, { status: 204 }); });
  const { http } = await import("@/lib/api/http");
  const request = http.get("/users/me", { signal: controller.signal });
  const assertion = expect(request).rejects.toMatchObject({ code: "ERR_CANCELED" });
  await startedRefresh;
  controller.abort();
  finishRefresh();
  await assertion;
  expect(fetchMock).toHaveBeenCalledTimes(4);
});

it("does not convert a CSRF 401 into successful logout", async () => {
  const ended = vi.spyOn(window, "dispatchEvent");
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
  const { logout } = await import("@/lib/auth/session");
  await expect(logout()).rejects.toMatchObject({ status: 401, path: "/auth/csrf" });
  expect(ended).not.toHaveBeenCalled();
});

it("preserves a CSRF failure during session restoration rather than treating it as expiry", async () => {
  const ended = vi.spyOn(window, "dispatchEvent");
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }));
  const { getSession } = await import("@/lib/auth/session");
  await expect(getSession()).rejects.toMatchObject({ status: 401, path: "/auth/csrf" });
  expect(ended).not.toHaveBeenCalled();
});

it("trims login email and does not try refresh on wrong credentials", async () => {
  fetchMock.mockResolvedValueOnce(Response.json(csrf)).mockResolvedValueOnce(new Response(null, { status: 401 }));
  const { login } = await import("@/lib/auth/session");
  await expect(login(" user@example.com ", "wrong")).rejects.toMatchObject({ status: 401 });
  expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining("/auth/login"), expect.objectContaining({
    body: '{"email":"user@example.com","password":"wrong"}',
  }));
  expect(lock).not.toHaveBeenCalled();
});

it("lets the browser generate a multipart boundary", async () => {
  fetchMock.mockResolvedValueOnce(Response.json(csrf)).mockResolvedValueOnce(new Response(null, { status: 204 }));
  const form = new FormData();
  form.append("name", "Updated");
  const { http } = await import("@/lib/api/http");
  await http.post("/upload", form);
  expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining("/upload"), expect.objectContaining({
    headers: expect.objectContaining({ "content-type": expect.stringMatching(/^multipart\/form-data; boundary=/) }),
    body: expect.stringContaining('name="name"'),
  }));
});
