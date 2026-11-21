import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render } from "../query-wrapper";
import LoginCard from "@/components/auth/LoginCard";
import { GOOGLE_NOT_CONFIGURED_MESSAGE, GOOGLE_SIGN_IN_FAILED_MESSAGE } from "@/components/auth/GoogleSignInButton";
import { GOOGLE_SIGNUP_EXPIRED_MESSAGE } from "@/components/auth/GoogleRoleDialog";
import { ApiError } from "@/lib/api/http";
import { completeGoogleRegistration, googleSignIn } from "@/lib/auth/session";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/auth/session", () => ({
  login: vi.fn(),
  googleSignIn: vi.fn(),
  completeGoogleRegistration: vi.fn(),
}));
// Load the Google script synchronously in tests: next/script just fires onReady after mount.
vi.mock("next/script", async () => {
  const { useEffect } = await import("react");
  return {
    default: function MockScript({ onReady }: { onReady?: () => void }) {
      useEffect(() => onReady?.(), [onReady]);
      return null;
    },
  };
});

let googleCallback: ((response: { credential: string }) => void) | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  googleCallback = undefined;
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com");
  window.google = {
    accounts: {
      id: {
        initialize: vi.fn(config => {
          googleCallback = config.callback;
        }),
        renderButton: vi.fn(parent => {
          const button = document.createElement("div");
          button.setAttribute("role", "button");
          button.textContent = "Đăng nhập bằng Google";
          parent.appendChild(button);
        }),
        cancel: vi.fn(),
      },
    },
  };
});

afterEach(() => {
  vi.unstubAllEnvs();
  delete window.google;
});

async function signInWithGoogle() {
  render(<LoginCard />);
  await waitFor(() => expect(googleCallback).toBeDefined());
  await act(async () => googleCallback!({ credential: "google-id-token" }));
}

const pending = {
  kind: "role-required" as const,
  pendingToken: "pending-token",
  email: "new.user@gmail.com",
  fullName: "New User",
  avatarUrl: null,
};

it("renders Google's own enabled button with the configured client id", async () => {
  render(<LoginCard />);
  await waitFor(() => expect(screen.getByTestId("google-signin-button")).toHaveTextContent("Đăng nhập bằng Google"));
  expect(window.google!.accounts.id.initialize).toHaveBeenCalledWith(
    expect.objectContaining({ client_id: "test-client-id.apps.googleusercontent.com", ux_mode: "popup" }),
  );
  expect(window.google!.accounts.id.renderButton).toHaveBeenCalledWith(
    expect.any(HTMLElement),
    expect.objectContaining({ theme: "outline", width: 400, locale: "vi" }),
  );
});

it("keeps the fallback button enabled and explains when Google is not configured", () => {
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
  render(<LoginCard />);
  const button = screen.getByRole("button", { name: "Đăng nhập với Google" });
  expect(button).toBeEnabled();
  fireEvent.click(button);
  expect(screen.getByRole("alert")).toHaveTextContent(GOOGLE_NOT_CONFIGURED_MESSAGE);
});

it("signs a linked account in and routes by role", async () => {
  vi.mocked(googleSignIn).mockResolvedValue({
    kind: "signed-in",
    account: { id: "id", email: "linked@gmail.com", fullName: "Linked", role: "LEARNER", status: "ACTIVE" },
  });
  await signInWithGoogle();
  expect(googleSignIn).toHaveBeenCalledWith("google-id-token");
  await waitFor(() => expect(push).toHaveBeenCalledWith("/", { transitionTypes: ["auth-in"] }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("shows a generic error when Google sign-in is refused", async () => {
  vi.mocked(googleSignIn).mockRejectedValue(new ApiError(401, "Google sign-in failed.", undefined, null, "/auth/google"));
  await signInWithGoogle();
  expect(await screen.findByRole("alert")).toHaveTextContent(GOOGLE_SIGN_IN_FAILED_MESSAGE);
  expect(push).not.toHaveBeenCalled();
});

it.each([
  ["Học viên", "LEARNER", { role: "LEARNER" as const }, "/"],
  ["Gia sư", "TUTOR", { role: "TUTOR" as const, tutorProfileStatus: "DRAFT" as const }, "/onboarding"],
])("asks for a role when the account does not exist and registers as %s", async (label, role, account, path) => {
  vi.mocked(googleSignIn).mockResolvedValue(pending);
  vi.mocked(completeGoogleRegistration).mockResolvedValue({
    id: "new-id",
    email: pending.email,
    fullName: pending.fullName,
    status: "ACTIVE",
    ...account,
  });
  await signInWithGoogle();

  const dialog = await screen.findByRole("dialog");
  expect(dialog).toHaveTextContent("Chọn vai trò của bạn");
  expect(dialog).toHaveTextContent(pending.email);
  const continueButton = screen.getByRole("button", { name: "Tiếp tục" });
  expect(continueButton).toBeDisabled();

  fireEvent.click(screen.getByRole("radio", { name: new RegExp(label) }));
  expect(screen.getByRole("radio", { name: new RegExp(label) })).toHaveAttribute("aria-checked", "true");
  fireEvent.click(continueButton);

  await waitFor(() => expect(completeGoogleRegistration).toHaveBeenCalledWith("pending-token", role));
  await waitFor(() => expect(push).toHaveBeenCalledWith(path, { transitionTypes: ["auth-in"] }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("explains an expired registration and lets the user close the dialog", async () => {
  vi.mocked(googleSignIn).mockResolvedValue(pending);
  vi.mocked(completeGoogleRegistration).mockRejectedValue(
    new ApiError(401, "Google sign-in failed.", undefined, null, "/auth/google/complete"),
  );
  await signInWithGoogle();
  fireEvent.click(await screen.findByRole("radio", { name: /Học viên/ }));
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(GOOGLE_SIGNUP_EXPIRED_MESSAGE);
  expect(screen.getByRole("button", { name: "Tiếp tục" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
});
