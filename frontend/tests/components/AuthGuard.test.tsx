import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthGuard } from "@/components/AuthGuard";
import { getSession } from "@/lib/auth/session";

const { replace, router } = vi.hoisted(() => { const replace = vi.fn(); return { replace, router: { replace } }; });
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/admin/dashboard" }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn(), logout: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
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
