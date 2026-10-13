import { act, screen, waitFor } from "@testing-library/react";
import { render } from "../query-wrapper";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthGuard } from "@/components/AuthGuard";
import { getSession } from "@/lib/auth/session";

const { replace, router, route } = vi.hoisted(() => { const replace = vi.fn(); return { replace, router: { replace }, route: { pathname: "/admin/dashboard" } }; });
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => route.pathname }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn(), logout: vi.fn() }));
beforeEach(() => { vi.resetAllMocks(); route.pathname = "/admin/dashboard"; });
it("hides protected content and redirects visitors", async () => {
  vi.mocked(getSession).mockResolvedValue(null);
  render(<AuthGuard role="ADMIN"><p>Private data</p></AuthGuard>);
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  expect(screen.queryByText("Private data")).not.toBeInTheDocument();
});
it("rejects the wrong server role despite spoofed client cookies", async () => {
  document.cookie = "user_role=ADMIN";
  vi.mocked(getSession).mockResolvedValue({ id: "1", fullName: "Learner", email: "l@example.com", role: "LEARNER", status: "ACTIVE" });
  render(<AuthGuard role="ADMIN"><p>Private data</p></AuthGuard>);
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/forbidden"));
  expect(screen.queryByText("Private data")).not.toBeInTheDocument();
  document.cookie = "user_role=; Max-Age=0";
});

const admin = { id: "admin", fullName: "Admin", email: "a@example.com", role: "ADMIN" as const, status: "ACTIVE" as const };

it("renders authorized content and hides it on terminal expiry", async () => {
  vi.mocked(getSession).mockResolvedValue(admin);
  render(<AuthGuard role="ADMIN"><p>Private data</p></AuthGuard>);
  expect(await screen.findByText("Private data")).toBeInTheDocument();
  act(() => window.dispatchEvent(new Event("session-ended")));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  expect(screen.queryByText("Private data")).not.toBeInTheDocument();
  expect(getSession).toHaveBeenCalledTimes(1);
});

it("retains cached private content during route navigation without showing status text", async () => {
  vi.mocked(getSession).mockResolvedValue(admin);
  const view = render(<AuthGuard role="ADMIN"><p>Private data</p></AuthGuard>);
  expect(await screen.findByText("Private data")).toBeInTheDocument();
  route.pathname = "/admin/users";
  view.rerender(<AuthGuard role="ADMIN"><p>Private data</p></AuthGuard>);
  expect(screen.getByText("Private data")).toBeInTheDocument();
  expect(screen.queryByText("Đang kiểm tra phiên đăng nhập...")).not.toBeInTheDocument();
});

it("shows a recoverable alert instead of redirecting on a focus network failure", async () => {
  vi.mocked(getSession).mockResolvedValueOnce(admin).mockRejectedValueOnce(new Error("Offline"));
  render(<AuthGuard role="ADMIN"><p>Private data</p></AuthGuard>);
  expect(await screen.findByText("Private data")).toBeInTheDocument();
  act(() => window.dispatchEvent(new Event("focus")));
  expect(await screen.findByRole("alert")).toHaveTextContent("Không thể kiểm tra phiên");
  expect(screen.queryByText("Private data")).not.toBeInTheDocument();
  expect(replace).not.toHaveBeenCalled();
});
