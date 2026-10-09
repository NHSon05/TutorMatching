import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegisterCard from "@/components/auth/RegisterCard";
import { registerAccount } from "@/lib/api/auth";

vi.mock("@/lib/api/auth", () => ({ registerAccount: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const mockedRegister = vi.mocked(registerAccount);

describe("RegisterCard", () => {
  beforeEach(() => {
    mockedRegister.mockReset();
  });

  it("shows field errors and preserves valid values", async () => {
    render(<RegisterCard />);
    await userEvent.type(screen.getByLabelText("Họ và tên"), "Nguyen Van A");
    await userEvent.type(screen.getByLabelText("Email"), "learner@example.com");
    await userEvent.type(screen.getByLabelText(/^Mật khẩu$/), "short");
    await userEvent.type(screen.getByLabelText("Xác nhận mật khẩu"), "different");

    await userEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(await screen.findByText("Mật khẩu phải có ít nhất 8 ký tự.")).toBeInTheDocument();
    expect(screen.getByText("Mật khẩu xác nhận không trùng khớp.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("learner@example.com");
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it("disables the form while submitting", async () => {
    mockedRegister.mockReturnValue(new Promise(() => {}));
    render(<RegisterCard />);
    await completeForm();

    await userEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(screen.getByRole("button", { name: "Đang đăng ký..." })).toBeDisabled();
  });

  it("shows duplicate email conflict on the email field", async () => {
    mockedRegister.mockRejectedValue({ status: 409, title: "Email đã được sử dụng" });
    render(<RegisterCard />);
    await completeForm();

    await userEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(await screen.findByText("Email này đã được sử dụng.")).toBeInTheDocument();
  });

  it("shows a success state after registration", async () => {
    mockedRegister.mockResolvedValue({
      id: "5a55413c-f936-4771-8aca-74392c944ce0",
      email: "learner@example.com",
      fullName: "Nguyen Van A",
      role: "LEARNER",
      status: "ACTIVE",
    });
    render(<RegisterCard />);
    await completeForm();

    await userEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Đăng ký thành công");
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "/login");
  });
});

async function completeForm() {
  fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "Nguyen Van A" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "learner@example.com" } });
  fireEvent.change(screen.getByLabelText(/^Mật khẩu$/), { target: { value: "password" } });
  fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu"), { target: { value: "password" } });
  await waitFor(() => expect(screen.getByLabelText("Email")).toHaveValue("learner@example.com"));
}
