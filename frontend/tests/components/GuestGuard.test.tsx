import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GuestGuard } from "@/components/GuestGuard";
import { getSession } from "@/lib/auth/session";
import { useAuthStore } from "@/stores/use-auth-store";
import { QueryProvider } from "@/providers/query-provider";

const { replace, router } = vi.hoisted(() => {
  const replace = vi.fn();
  return { replace, router: { replace } };
});

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

describe("GuestGuard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.getState().clearAuth();
    vi.mocked(getSession).mockResolvedValue(null);
  });

  it("renders guest content when user is unauthenticated", async () => {
    render(
      <QueryProvider>
        <GuestGuard>
          <p>Login Form Content</p>
        </GuestGuard>
      </QueryProvider>
    );

    expect(await screen.findByText("Login Form Content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("blocks and redirects authenticated LEARNER to /", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "learner-1",
      email: "learner@example.com",
      fullName: "Learner User",
      role: "LEARNER",
      status: "ACTIVE",
    });

    render(
      <QueryProvider>
        <GuestGuard>
          <p>Login Form Content</p>
        </GuestGuard>
      </QueryProvider>
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(screen.queryByText("Login Form Content")).not.toBeInTheDocument();
  });

  it("blocks and redirects authenticated TUTOR to /tutor/dashboard", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "tutor-1",
      email: "tutor@example.com",
      fullName: "Tutor User",
      role: "TUTOR",
      status: "ACTIVE",
      tutorProfileStatus: "APPROVED",
    });

    render(
      <QueryProvider>
        <GuestGuard>
          <p>Login Form Content</p>
        </GuestGuard>
      </QueryProvider>
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/tutor/dashboard"));
    expect(screen.queryByText("Login Form Content")).not.toBeInTheDocument();
  });

  it("blocks and redirects unverified TUTOR to /tutor/onboarding", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "tutor-1",
      email: "tutor@example.com",
      fullName: "Tutor User",
      role: "TUTOR",
      status: "ACTIVE",
      tutorProfileStatus: "PENDING_REVIEW",
    });

    render(
      <QueryProvider>
        <GuestGuard>
          <p>Login Form Content</p>
        </GuestGuard>
      </QueryProvider>
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/tutor/onboarding"));
    expect(screen.queryByText("Login Form Content")).not.toBeInTheDocument();
  });

  it("blocks and redirects authenticated ADMIN to /admin/dashboard", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      fullName: "Admin User",
      role: "ADMIN",
      status: "ACTIVE",
    });

    render(
      <QueryProvider>
        <GuestGuard>
          <p>Login Form Content</p>
        </GuestGuard>
      </QueryProvider>
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/dashboard"));
    expect(screen.queryByText("Login Form Content")).not.toBeInTheDocument();
  });

  it("immediately blocks when SSR initialRole is provided without flashing form", async () => {
    render(
      <QueryProvider>
        <GuestGuard initialRole="LEARNER">
          <p>Login Form Content</p>
        </GuestGuard>
      </QueryProvider>
    );

    expect(screen.queryByText("Login Form Content")).not.toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("blocks when user is stored in useAuthStore even while session query is pending", async () => {
    vi.mocked(getSession).mockReturnValue(new Promise(() => {}));
    useAuthStore.getState().setAuth({
      user: {
        id: "store-user",
        email: "user@example.com",
        fullName: "Store User",
        role: "TUTOR",
        status: "ACTIVE",
      },
    });

    render(
      <QueryProvider>
        <GuestGuard>
          <p>Login Form Content</p>
        </GuestGuard>
      </QueryProvider>
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/tutor/dashboard"));
    expect(screen.queryByText("Login Form Content")).not.toBeInTheDocument();
  });
});
