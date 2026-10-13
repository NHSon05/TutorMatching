import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { render } from "../query-wrapper";
import { AuthGuard } from "@/components/AuthGuard";
import { LogoutButton } from "@/components/LogoutButton";
import LearnerNavbar from "@/components/navigation/LearnerNavbar";
import { getSession, logout } from "@/lib/auth/session";

const { router, route } = vi.hoisted(() => ({ router: { replace: vi.fn() }, route: { path: "/" } }));
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => route.path }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn(), logout: vi.fn(), login: vi.fn() }));
const account = { id: "learner", fullName: "Test Learner", email: "l@example.com", role: "LEARNER" as const, status: "ACTIVE" as const };

beforeEach(() => {
  vi.resetAllMocks();
  route.path = "/";
  vi.mocked(getSession).mockResolvedValue(account);
});

function renderNavbar() {
  return render(<AuthGuard role="LEARNER"><LearnerNavbar /><p>Private content</p></AuthGuard>);
}

it("renders one logout inside the navbar without starting another session query", async () => {
  renderNavbar();
  const navbar = await screen.findByRole("banner", { name: "Thanh điều hướng học viên" });
  expect(within(navbar).getByText(account.fullName)).toBeInTheDocument();
  expect(within(navbar).getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Đăng xuất" })).toHaveLength(1);
  expect(within(navbar).getByRole("link", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
  expect(getSession).toHaveBeenCalledTimes(1);
  act(() => window.dispatchEvent(new Event("focus")));
  expect(await screen.findByRole("banner", { name: "Thanh điều hướng học viên" })).toBeInTheDocument();
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
  expect(getSession).toHaveBeenCalledTimes(2);
});

it("marks a descendant route active", async () => {
  route.path = "/learner/my-tutors/123";
  renderNavbar();
  const nav = await screen.findByRole("navigation", { name: "Điều hướng học viên" });
  expect(within(nav).getByRole("link", { name: "Gia sư của tôi" })).toHaveAttribute("aria-current", "page");
  expect(within(nav).getByRole("link", { name: "Tổng quan" })).not.toHaveAttribute("aria-current");
});

it("disables navbar logout while pending and redirects after success", async () => {
  let finish!: () => void;
  vi.mocked(logout).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  renderNavbar();
  fireEvent.click(await screen.findByRole("button", { name: "Đăng xuất" }));
  const pending = await screen.findByRole("button", { name: "Đang đăng xuất..." });
  expect(pending).toBeDisabled();
  fireEvent.click(pending);
  expect(logout).toHaveBeenCalledTimes(1);
  await act(async () => finish());
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
  expect(screen.queryByText("Private content")).not.toBeInTheDocument();
});

it("keeps logout failures retryable without redirecting", async () => {
  vi.mocked(logout).mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce(undefined);
  renderNavbar();
  fireEvent.click(await screen.findByRole("button", { name: "Đăng xuất" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Đăng xuất chưa thành công");
  expect(router.replace).not.toHaveBeenCalled();
  const button = screen.getByRole("button", { name: "Đăng xuất" });
  expect(button).toBeEnabled();
  fireEvent.click(button);
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
});

it("keeps the guard presentation-free and the logout control usable without account props", async () => {
  const view = render(<AuthGuard role="LEARNER"><p>Private content</p></AuthGuard>);
  expect(await screen.findByText("Private content")).toBeInTheDocument();
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Đăng xuất" })).not.toBeInTheDocument();
  view.unmount();
  render(<LogoutButton />);
  expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
});
