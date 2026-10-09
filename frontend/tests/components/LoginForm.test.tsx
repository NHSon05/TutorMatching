import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import LoginCard from "@/components/auth/LoginCard";
import { login } from "@/lib/auth/session";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/auth/session", () => ({ login: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); });
function submit() {
  render(<LoginCard />);
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "learner@example.com" } });
  fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "password" } });
  fireEvent.click(screen.getByRole("button", { name: /^Đăng nhập$/ }));
}
it("disables submit while awaiting the server", () => {
  vi.mocked(login).mockReturnValue(new Promise(() => {}));
  submit();
  expect(screen.getByRole("button", { name: "Đang đăng nhập..." })).toBeDisabled();
});
it.each([401, 403, 429])("uses a neutral error for denial %s", async status => {
  vi.mocked(login).mockRejectedValue({ status });
  submit();
  expect(await screen.findByText("Không thể đăng nhập. Kiểm tra thông tin hoặc thử lại sau.")).toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
});
it("routes using the server role", async () => {
  vi.mocked(login).mockResolvedValue({ id: "id", email: "learner@example.com", fullName: "Tutor", role: "TUTOR", status: "ACTIVE" });
  submit();
  await waitFor(() => expect(push).toHaveBeenCalledWith("/tutor/dashboard"));
  expect(document.cookie).not.toContain("demo_token");
});
