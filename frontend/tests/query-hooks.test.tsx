import { act, renderHook, waitFor } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { QueryProvider } from "@/providers/query-provider";
import { useSession } from "@/hooks/use-session";
import { useLogin, useLogout, useRegister } from "@/hooks/use-auth";
import { getSession, login, logout } from "@/lib/auth/session";
import { registerAccount, type AccountResponse } from "@/lib/api/auth";
import { sessionKey } from "@/lib/query/client";

vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn(), login: vi.fn(), logout: vi.fn() }));
vi.mock("@/lib/api/auth", () => ({ registerAccount: vi.fn() }));
const account: AccountResponse = { id: "one", email: "one@example.com", fullName: "One", role: "LEARNER", status: "ACTIVE" };
const wrapper = QueryProvider;
beforeEach(() => vi.resetAllMocks());

it("shares a pending session query and forwards cancellation to the service", async () => {
  let resolve!: (account: AccountResponse) => void;
  vi.mocked(getSession).mockImplementation(() => new Promise(done => { resolve = done; }));
  const { result } = renderHook(() => ({ first: useSession(), second: useSession() }), { wrapper });
  expect(result.current.first.isPending).toBe(true);
  expect(getSession).toHaveBeenCalledTimes(1);
  expect(getSession).toHaveBeenCalledWith(expect.any(AbortSignal));
  await act(async () => resolve(account));
  await waitFor(() => expect(result.current.first.data).toEqual(account));
  expect(result.current.second.data).toEqual(account);
});

it("has a stable client on rerenders but not across provider instances", () => {
  const first = renderHook(() => useQueryClient(), { wrapper });
  const client = first.result.current;
  first.rerender();
  expect(first.result.current).toBe(client);
  const second = renderHook(() => useQueryClient(), { wrapper });
  expect(second.result.current).not.toBe(client);
});

it("reports session errors without retrying or erasing cached identity", async () => {
  vi.mocked(getSession).mockResolvedValueOnce(account).mockRejectedValueOnce(new Error("Offline"));
  const { result } = renderHook(() => {
    const { data, error, refetch } = useSession();
    return { data, error, refetch };
  }, { wrapper });
  await waitFor(() => expect(result.current.data).toEqual(account));
  await act(async () => { await result.current.refetch(); });
  await waitFor(() => expect(result.current.error?.message).toBe("Offline"));
  expect(result.current.data).toEqual(account);
  expect(getSession).toHaveBeenCalledTimes(2);
});

it("ends a session during its own request without refetch loops", async () => {
  vi.mocked(getSession).mockImplementation(async () => {
    await Promise.resolve();
    window.dispatchEvent(new Event("session-ended"));
    return null;
  });
  const { result } = renderHook(() => useSession(), { wrapper });
  await waitFor(() => expect(result.current.data).toBeNull());
  expect(result.current.isFetching).toBe(false);
  expect(result.current.isFetchedAfterMount).toBe(true);
  expect(getSession).toHaveBeenCalledTimes(1);
});

it("clears private data and cancels late reads when the session ends", async () => {
  const { result } = renderHook(() => useQueryClient(), { wrapper });
  const client = result.current;
  client.setQueryData(sessionKey, account);
  client.setQueryData(["private", "profile"], { secret: "one" });
  await client.fetchQuery({ queryKey: ["public", "subjects"], queryFn: async () => ["Math"], meta: { public: true } });
  let finish!: (value: string) => void;
  let signal!: AbortSignal;
  const pending = client.fetchQuery({ queryKey: ["private", "late"], queryFn: context => {
    signal = context.signal;
    return new Promise<string>(resolve => { finish = resolve; });
  } }).catch(() => undefined);
  act(() => window.dispatchEvent(new Event("session-ended")));
  expect(signal.aborted).toBe(true);
  expect(client.getQueryData(sessionKey)).toBeNull();
  expect(client.getQueryData(["private", "profile"])).toBeUndefined();
  expect(client.getQueryData(["public", "subjects"])).toEqual(["Math"]);
  finish("old data");
  await pending;
  expect(client.getQueryData(["private", "late"])).toBeUndefined();
});

it("login removes previous private data and seeds the server account", async () => {
  vi.mocked(login).mockResolvedValue(account);
  const { result } = renderHook(() => ({ mutation: useLogin(), client: useQueryClient() }), { wrapper });
  result.current.client.setQueryData(["private", "old-user"], "old secret");
  await act(async () => {
    const data = await result.current.mutation.mutateAsync({ email: account.email, password: "password" });
    expect(data).toEqual(account);
  });
  expect(result.current.client.getQueryData(sessionKey)).toEqual(account);
  expect(result.current.client.getQueryData(["private", "old-user"])).toBeUndefined();
  expect(login).toHaveBeenCalledTimes(1);
  act(() => result.current.mutation.reset());
  await waitFor(() => expect(result.current.client.getMutationCache().getAll()).toHaveLength(0));
});

it("failed login exposes an error without retries or changing the session", async () => {
  vi.mocked(login).mockRejectedValue(new Error("Denied"));
  const { result } = renderHook(() => ({ mutation: useLogin(), client: useQueryClient() }), { wrapper });
  result.current.client.setQueryData(sessionKey, account);
  await act(async () => {
    await expect(result.current.mutation.mutateAsync({ email: "wrong", password: "wrong" })).rejects.toThrow("Denied");
  });
  await waitFor(() => expect(result.current.mutation.isError).toBe(true));
  expect(login).toHaveBeenCalledTimes(1);
  expect(result.current.client.getQueryData(sessionKey)).toEqual(account);
});

it("registration returns data but does not establish a session", async () => {
  vi.mocked(registerAccount).mockResolvedValue(account);
  const { result } = renderHook(() => ({ mutation: useRegister(), client: useQueryClient() }), { wrapper });
  await act(async () => {
    await result.current.mutation.mutateAsync({ fullName: "One", email: account.email, password: "password", passwordConfirmation: "password", role: "LEARNER" });
  });
  await waitFor(() => expect(result.current.mutation.data).toEqual(account));
  expect(result.current.client.getQueryData(sessionKey)).toBeUndefined();
});

it("logout clears session only after success and does not retry failures", async () => {
  vi.mocked(logout).mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce(undefined);
  const { result } = renderHook(() => ({ mutation: useLogout(), client: useQueryClient() }), { wrapper });
  result.current.client.setQueryData(sessionKey, account);
  result.current.client.setQueryData(["private", "profile"], "secret");
  await act(async () => { await expect(result.current.mutation.mutateAsync()).rejects.toThrow("Offline"); });
  expect(logout).toHaveBeenCalledTimes(1);
  expect(result.current.client.getQueryData(sessionKey)).toEqual(account);
  await act(async () => { await result.current.mutation.mutateAsync(); });
  expect(result.current.client.getQueryData(sessionKey)).toBeNull();
  expect(result.current.client.getQueryData(["private", "profile"])).toBeUndefined();
});

it("refetches an observed session on window focus", async () => {
  vi.mocked(getSession).mockResolvedValue(account);
  const { result } = renderHook(() => useSession(), { wrapper });
  await waitFor(() => expect(result.current.data).toEqual(account));
  act(() => window.dispatchEvent(new Event("focus")));
  await waitFor(() => expect(getSession).toHaveBeenCalledTimes(2));
});

it("cancels an old session query before login can seed a different account", async () => {
  let finish!: (value: AccountResponse) => void;
  vi.mocked(getSession).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  vi.mocked(login).mockResolvedValue({ ...account, id: "two" });
  const { result } = renderHook(() => ({ session: useSession(), login: useLogin(), client: useQueryClient() }), { wrapper });
  await act(async () => { await result.current.login.mutateAsync({ email: "two@example.com", password: "password" }); });
  await act(async () => finish(account));
  expect(result.current.client.getQueryData(sessionKey)).toMatchObject({ id: "two" });
});
