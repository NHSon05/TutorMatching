import { afterEach, expect, it, vi } from "vitest";
import { resolveAvatarUrl, validateProfile } from "@/lib/api/profile";
import { fetchTransport } from "./http-test-transport";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("uses PUT with CSRF/cookies and strips non-contract fields", async () => {
  vi.resetModules();
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchTransport(fetchMock));
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:5014/api/v1");
  fetchMock.mockResolvedValueOnce(Response.json({ requestToken: "csrf", headerName: "X-CSRF-TOKEN" }));
  fetchMock.mockResolvedValueOnce(Response.json({ id: "user-1" }));
  const { updateCurrentProfile } = await import("@/lib/api/profile");
  const fields = { fullName: "New Name", phoneNumber: null, dateOfBirth: null, avatarUrl: null };
  await updateCurrentProfile({ ...fields, ...{ email: "injected@example.com", role: "ADMIN", id: "another-user" } });
  expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:5014/api/v1/users/me", expect.objectContaining({
    method: "PUT", credentials: "include", body: JSON.stringify(fields),
    headers: expect.objectContaining({ "x-csrf-token": "csrf" }),
  }));
});
it.each(["javascript:alert(1)", "https://user:password@example.com/a.png", "/uploads/avatars/../other", "/uploads/avatars/%2e%2e/a", "https://example.com/\\a"])("rejects unsafe avatar value %s", avatarUrl => {
  expect(validateProfile({ fullName: "Valid Name", phoneNumber: null, dateOfBirth: null, avatarUrl })).toHaveProperty("avatarUrl");
});
it("resolves local upload paths against the API origin", () => {
  expect(resolveAvatarUrl("/uploads/avatars/photo.png")).toMatch(/\/uploads\/avatars\/photo\.png$/);
  expect(resolveAvatarUrl("/uploads/avatars/photo.png")).not.toContain("/api/v1/");
  expect(resolveAvatarUrl("javascript:alert(1)")).toBeUndefined();
});
it("rejects malformed dates and accepts empty optional fields", () => {
  const request = { fullName: "Valid Name", phoneNumber: null, dateOfBirth: null, avatarUrl: null };
  expect(validateProfile(request)).toEqual({});
  expect(validateProfile({ ...request, dateOfBirth: "2001-02-30" })).toHaveProperty("dateOfBirth");
});
